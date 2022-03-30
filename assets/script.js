var slider = document.getElementById("partition"); //for getting warmup/main partition
var output = document.getElementById("partitionValue");
output.innerHTML = slider.value; // Display the default slider value


//arrays for mapping difficulty and randomness to a definite yardage.
//indexes 0-1 are sprint, 2-3 are "good workout", 4-5 are "tough/distance"
var kickYards = [25, 50, 50, 75, 75, 100];

var freeYards = [50, 75, 100, 150, 200, 400];
var backYards = [50, 75, 100, 100, 150, 200];
var breastYards = [50, 50, 75, 100, 150, 200];
var flyYards = [50, 50, 75, 100, 150, 200];
var IMYards = [100, 100, 100, 200, 200, 400];

//arrays for max repititions of stroke and distance. 
//corresponds to the relevant strokeYards array.
var freeCap = [10, 8, 6, 4, 4, 2];
var backCap = [10, 8, 6, 6, 4, 4];
var breastCap = [10, 10, 8, 6, 4, 4];
var flyCap = [10, 10, 8, 6, 4, 4];
var IMCap = [6, 6, 6, 4, 4, 2];

//more arrays to map a random selection to a string for stroke. 
//YardsbyStroke maps the stroke name to its yardage array. 
//CapByStroke maps the stroke name to the max repetitions of stroke.
var kickOrDrill = ["Kick", "Drill"];
var strokeNames = ["Free", "Back", "Breast", "Fly", "IM"];
var yardsByStroke = [freeYards, backYards, breastYards, flyYards, IMYards];
var capByStroke = [freeCap, backCap, breastCap, flyCap, IMCap];

//array to hold set strings
let set = [];

//used to *try* to prevent staleness
let usedStrokes = [];
let usedYardages = [];

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function () {
    output.innerHTML = this.value - (this.value % 10);
}

//On submit button, get all input values as parameters then call generateSet()
function submit() {
    var yardage = document.getElementById("yardage").value;
    if (yardage < 500) {
        document.getElementById("result").innerHTML = "Yardage is too small.";
        return;
    }
    if (yardage > 6000) {
        document.getElementById("result").innerHTML = "Let's not get ahead of ourselves...";
        return;
    }
    yardage = yardage - (yardage % 1000);
    var partition = slider.value - (slider.value % 10);
    var stroke = document.getElementById("strokeSelect").value;
    var difficulty = document.getElementById("difficultySelect").value;
    usedStrokes = [];
    usedYardages = [];
    //document.getElementById("result").innerHTML = yardage + " " + partition + " " + stroke + " " + difficulty;
    generateSet(yardage, partition, stroke, difficulty);
}

//is called by the "jesus take the wheel button". Will call generateSet with randomized parameters, within reasonable bounds.
function clownfiesta() {
    var yardage = getRandomInt(4000);
    yardage = yardage - (yardage % 500) + 2000;
    var partition = getRandomInt(50);
    partition = partition - (partition % 10);
    var stroke = getRandomInt(5) + 1;
    var difficulty = getRandomInt(2) + 1;
    usedStrokes = [];
    usedYardages = [];

    //document.getElementById("result").innerHTML = yardage + " " + partition + " " + stroke + " " + difficulty;
    generateSet(yardage, partition, stroke, difficulty);
}

//helper to generate int from 0-max
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

//generate set using total yardage, partition ratio of warmup:mainset, which stroke, difficulty setting
function generateSet(yardage, partition, stroke, difficulty) {
    //select collect stroke and yardage arrays
    var strokeSelection = strokeNames[stroke - 1];
    var strokeYardArray = yardsByStroke[stroke - 1];
    var strokeCapArray = capByStroke[stroke - 1]; //currently unused because of adaptive set chunking implementation
    var runningTotal = 0; //running total based

    //make a decimal from percentage whole number
    partition = partition / 100;

    //make warmup and yardage chunks
    var allottedWarmup = yardage * partition;
    var allottedMain = yardage - allottedWarmup;

    //because procedurally generated warmups will get stale easily at high yardages, the decision was made to limit the warmup chunk to 800 yards.
    //the rest of the yardage moves to the main set.
    //This change will be reverted once a method of sourcing human-written warmup sets is implemented.
    if(allottedWarmup > 800) {
        allottedMain += allottedWarmup-800;
        allottedWarmup = 800;
    }

    //note: the expression "difficulty * 2 - 1 - getRandomInt(2)" is used to map a difficulty value to one of two corresponding yardages
    //chosen randomly. See above notes for which indexes represent which difficulties. 


    //generate the warmup
    //every warmup will contain a 300 or 200 choice
    if (allottedWarmup < 500) { //deal with case where allotment is too small to procedurally generate
        set.push("300 Choice");
        runningTotal += 300;
        allottedWarmup -= 300;
    } else {
        set.push("200 Choice");
        allottedWarmup -= 200;
        runningTotal += 200;
        if (allottedWarmup >= 500) {

            //otherwise, split allotment into two chunks. Chunks are divided by selected yardage (see method for choosing above), and the
            //quotient becomes the repetitions or "count."
            //assuming the count is positive, a string representation of the stroke, yards, and repetition is pushed into set array.
            var warmup1 = allottedWarmup / 2;
            var warmup2 = warmup1;

            var yard1 = kickYards[difficulty * 2 - 1 - getRandomInt(2)];
            var count1 = Math.floor(warmup1 / yard1);
            runningTotal += yard1 * count1;
            if (count1 > 0) set.push(count1 + "x" + yard1 + " " + strokeSelection + " " + kickOrDrill[getNonStaleYardage()]);

            var yard2 = kickYards[difficulty * 2 - 1 - getRandomInt(1)];
            var count2 = Math.floor(warmup2 / yard2);
            runningTotal += yard2 * count2;
            if (count2 > 0) set.push(count2 + "x" + yard2 + " " + strokeSelection + " " + kickOrDrill[getNonStaleYardage()]);
        } else {
            var yard = kickYards[difficulty * 2 - 1 - getRandomInt(1)];
            var count = Math.floor(allottedWarmup / yard);
            runningTotal += yard * count;
            if (count1 > 0) set.push(count + "x" + yard + " " + strokeSelection + " " + kickOrDrill[getRandomInt(2)]);
        }
    }

    //main set generation is the same other than the number of chunks. If the yardage is above 1600, then the number of chunks becomes
    //the allotted yardage divided by 400. The remainder is dealt with later.

    //swim sets generally are a combination of a chosen stroke, freestyle, and IM/Individual Medley to combat staleness. For each chunk,
    //one of those three strokes will be selected. If freestyle or IM are the stroke selection, then it will be chosen twice as often.
    var whichStrokeMain = ["Free", "IM", strokeSelection];
    var whichStrokeYards = [freeYards, IMYards, strokeYardArray];

    if (allottedMain > 1600) {
        var n = Math.floor(allottedMain/400);
        //console.log(n);
        var nextmain = 0;

        for (var i = 0; i < n; i++) {
            var main = 400 + nextmain;
            var which = getNonStaleStroke(); //see explaination of nonStaleStroke() below
            var yard = whichStrokeYards[which][difficulty * 2 - 1 - getNonStaleYardage()];
            var count = Math.floor(main / yard);
            runningTotal += yard * count;
            if (count > 0) set.push(count + "x" + yard + " " + whichStrokeMain[which]);
            if (yard * count < 400) {
                nextmain = yard * count - 400;
            } else {
                nextmain = 0;
            }
        }
    } else {

        //if main yardage allotted is less than 1600, then it will be split randomly into either 2, 3, or 4 sections
        //the same method is used to get a set from a chunk
        var sections = getRandomInt(3) + 2;
        switch (sections) {
            case 2:
                var main1 = allottedMain / 2;
                var main2 = main1;

                //var which1 = getRandomInt(3);
                //var yard1 = whichStrokeYards[which1][difficulty * 2 - 1 - getRandomInt(2)];
                var yard1 = strokeYardArray[difficulty * 2 - 1 - getNonStaleYardage()];
                var count1 = Math.floor(main1 / yard1);
                runningTotal += yard1 * count1;
                if (count1 > 0) set.push(count1 + "x" + yard1 + " " + strokeSelection);

                var which2 = getNonStaleStroke();
                var yard2 = whichStrokeYards[which2][difficulty * 2 - 1 - getNonStaleYardage()];
                var count2 = Math.floor(main2 / yard2);
                runningTotal += yard2 * count2;
                if (count2 > 0) set.push(count2 + "x" + yard2 + " " + whichStrokeMain[which2]);

                break;
            case 3:
                var main1 = allottedMain / 3 - ((allottedMain / 3) % 50);
                var main2 = main1;
                var main3 = main1;

                var which1 = getNonStaleStroke();
                var yard1 = whichStrokeYards[which1][difficulty * 2 - 1 - getNonStaleYardage()];
                var count1 = Math.floor(main1 / yard1);
                runningTotal += yard1 * count1;
                if (count1 > 0) set.push(count1 + "x" + yard1 + " " + whichStrokeMain[which1]);

                var which2 = getNonStaleStroke();
                var yard2 = whichStrokeYards[which2][difficulty * 2 - 1 - getNonStaleYardage()];
                var count2 = Math.floor(main2 / yard2);
                runningTotal += yard2 * count2;
                if (count2 > 0) set.push(count2 + "x" + yard2 + " " + whichStrokeMain[which2]);

                var which3 = getNonStaleStroke();
                var yard3 = whichStrokeYards[which3][difficulty * 2 - 1 - getNonStaleYardage()];
                var count3 = Math.floor(main3 / yard3);
                runningTotal += yard3 * count3;
                if (count3 > 0) set.push(count3 + "x" + yard3 + " " + whichStrokeMain[which3]);

                break;
            case 4:
                var main1 = allottedMain / 4 - ((allottedMain / 4) % 50);
                var main2 = main1;
                var main3 = main1;
                var main4 = main1;

                var which1 = getNonStaleStroke();
                var yard1 = whichStrokeYards[which1][difficulty * 2 - 1 - getNonStaleYardage()];
                var count1 = Math.floor(main1 / yard1);
                runningTotal += yard1 * count1;
                if (count1 > 0) set.push(count1 + "x" + yard1 + " " + whichStrokeMain[which1]);

                var which2 = getNonStaleStroke();
                var yard2 = whichStrokeYards[which2][difficulty * 2 - 1 - getNonStaleYardage()];
                var count2 = Math.floor(main2 / yard2);
                runningTotal += yard2 * count2;
                if (count2 > 0) set.push(count2 + "x" + yard2 + " " + whichStrokeMain[which2]);

                var which3 = getNonStaleStroke();
                var yard3 = whichStrokeYards[which3][difficulty * 2 - 1 - getNonStaleYardage()];
                var count3 = Math.floor(main3 / yard3);
                runningTotal += yard3 * count3;
                if (count3 > 0) set.push(count3 + "x" + yard3 + " " + whichStrokeMain[which3]);

                var which4 = getNonStaleStroke();
                var yard4 = whichStrokeYards[which4][difficulty * 2 - 1 - getNonStaleYardage()];
                var count4 = Math.floor(main4 / yard4);
                runningTotal += yard4 * count4;
                if (count4 > 0) set.push(count4 + "x" + yard4 + " " + whichStrokeMain[which4]);

                break;

        }
    }

    //this is where the remainder is dealt with. If the remaining yardage is over 400 somehow, then it is made into another main set chunk.
    //Otherwise, the remainder is tacked on to the end as cooldown.
    var remainder = yardage - runningTotal;
    if(remainder > 500) {
        console.log(remainder);
        var n = Math.floor(remainder/400);
        console.log(n);
        var nextmain = 0;

        for (var i = 0; i < n; i++) {
            var main = 400 + nextmain;
            var which = getNonStaleStroke();
            var yard = whichStrokeYards[which][difficulty * 2 - 1 - getNonStaleYardage()];
            var count = Math.floor(main / yard);
            runningTotal += yard * count;
            if (count > 0) set.push(count + "x" + yard + " " + whichStrokeMain[which]);
            if (yard * count < 400) {
                nextmain = yard * count - 400;
            } else {
                nextmain = 0;
            }
        }
    }
    remainder = yardage - runningTotal;


    //make remainder cooldown
    if (remainder >= 0) {
        var cooldown = remainder - (remainder % 25);
        set.push(cooldown + " Cooldown");
        runningTotal += cooldown;
    }

    set.push(runningTotal + " Total Yards out of " + yardage);

    dumpSet();
}

//prints out the set into the div window
function dumpSet() {
    document.getElementById('result').innerHTML = '';

    set.forEach(function (item, index, array) {
        var tag = document.createElement("p");
        var text = document.createTextNode(item);
        tag.appendChild(text);
        document.getElementById("result").appendChild(tag);
    })

    //reset the set array for next generation
    set = [];
}

//if less then three strokes (represented as ints for array indexing) have been selected, then it will choose one that hasn't been chosen
//This is done by storing chosen strokes/ints in a usedStrokes array.
//if all three strokes have been chosen, then it will choose at random. This was a design choice as resetting the usedStrokes would make
//the set feel too procedural.
function getNonStaleStroke() {
    if (usedStrokes.length == 3) {
        return getRandomInt(3);
    }
    var which1 = getRandomInt(3);
    while (usedStrokes.includes(which1)) {
        which1 = getRandomInt(3);
    }
    usedStrokes.push(which1);
    return which1;
}

//same principle as nonStaleStroke except the yardage only has two options per difficulty (see way above for details).
function getNonStaleYardage() {
    if (usedStrokes.length >= 2) {
        return getRandomInt(2);
    }
    var which1 = getRandomInt(2);
    while (usedStrokes.includes(which1)) {
        which1 = getRandomInt(2);
    }
    usedStrokes.push(which1);
    return which1;
}

