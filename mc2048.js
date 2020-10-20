// inspired by https://towardsdatascience.com/2048-solving-2048-with-monte-carlo-tree-search-ai-2dbe76894bab
// implements for p5.js 
 
// some global variables that user can change to their liking 
var boardWidth = 4;
var boardHeight = 4;
var cardsToStartWith = 2;
var cardWidth = 50;
var cardHeight = 50;
var cardSpacer = 5;
var newTilesPerMove = 1;
var board;
var MANUAL = 0
var MONTECARLOSEARCH = 1
var RANDOMWALK=2
var mode = MANUAL
var searchDepth = -1
var RUNS = 5
var is_running = false;
var myBarChart;                   
var stopAtGivenValue = 0                // set to integer > 0 to stop when that value appears, must be power of 2

// 2,4,8,16,32,64,128,256,512,1024,2048
var colors = [ 
                [255,0,0], 
                [255,96,208], 
                [160,32,255], 
                [80,208,255],
                [0,32,255],
                [96,255,128],
                [0,192,0],
                [255,224,32],
                [255,160,16],
                [160,128,96],
                [255,208,160]
                ]
var multiGameStatistics = []


function keyToString( keyCode ) {
    switch( keyCode ) {
        case UP_ARROW:
            return "UP"
        case DOWN_ARROW:
            return "DOWN"
        case LEFT_ARROW:
            return "LEFT"
        case RIGHT_ARROW:
            return "RIGHT"
    }
}

function generateMove(numAvailable=4) {
    return floor( random( 0, numAvailable) );
}


function isWinningBoard(position) {
    for( let ii=0; ii < position.length; ii++ ) {
        if ( position[ii] == stopAtGivenValue ) {
            return true;
        }
    }
    return false;
}

function isGameOver(position) {
    // the game is over either when all squares are full
    // or potentially when we reach a target value
    for( let ii=0; ii < position.length; ii++ ) {
        if ( stopAtGivenValue > 0 && position[ii] === stopAtGivenValue ) {
            return true;
        }
        // if there are empty spaces then we are not over.
        if ( position[ii] === 0 ) {
            return false
        }
    }
    // this piece is needed as if a board is full but we need
    // to test each number is not next to a number of the same value
    for( let x = 0; x < boardWidth; x++ ) {
        for( let y =0; y < boardHeight; y++ ) {
            let index = ( x * boardWidth) + y
            // all numbers must be next to different numbers if there
            // are spaces then there are still valid moves
            if ( position[index] > 0 ) {
                if ( x > 0 && position[index-1] === position[index] ) {
                    return false;
                }
                if ( x < boardWidth-1 && position[index+1] === position[index] ) {
                    return false;
                }
                if ( y < boardHeight-1 && position[index+boardWidth] === position[index] ) {
                    return false;
                }
                if ( y > 0 && position[index-boardWidth] === position[index] ) {
                    return false;
                }  
            }
            
        }
    }
    return true;
}

function doSingleMove( position, index, move, allowFlashes = false ) {
    let changes = 0;
    let localchanges = 1;
    let merged = false
    let score = 0
    while ( localchanges > 0 ) {
        localchanges = 0;
        switch( move ) {
        case UP_ARROW:
            if ( index >= boardWidth ) {
                if ( position[index-boardWidth] == 0 ) {
                    position[index-boardWidth] = position[index];
                    position[index] = 0;
                    index = index-boardWidth
                    localchanges++;
                } else if ( position[index-boardWidth] == position[index] ) {
                    position[index-boardWidth] = position[index] + position[index-boardWidth]
                    position[index] = 0;
                    index = index-boardWidth
                    localchanges++;
                    merged = true
                    score += position[index]
                    if ( allowFlashes ) {
                        board.flash(position, index )
                    }
                }
            }
            break;
        case DOWN_ARROW:
            if ( index < (boardHeight * boardWidth-1) ) {
                if ( position[index+boardWidth] == 0 ) {
                    position[index+boardWidth] = position[index];
                    position[index] = 0;
                    index = index+boardWidth
                    localchanges++;
                } else if ( position[index+boardWidth] == position[index]  ) {
                    position[index+boardWidth] = position[index] + position[index+boardWidth]
                    position[index] = 0;
                    index = index+boardWidth
                    localchanges++;
                    merged = true
                    score += position[index]
                    if ( allowFlashes ) {
                        board.flash(position, index )
                    }
                }
            }
            break;
        case LEFT_ARROW:
            if ( index % boardWidth > 0 ) {
                if ( position[index-1] == 0 ) {
                    position[index-1] = position[index];
                    position[index] = 0;
                    index = index-1
                    localchanges++;
                } else if ( position[index-1] == position[index]  ) {
                    position[index-1] = position[index] + position[index-1]
                    position[index] = 0;
                    index = index-1
                    localchanges++;
                    merged = true
                    score += position[index]
                    if ( allowFlashes ) {
                        board.flash(position, index )
                    }
                }
            }
            break;
        case RIGHT_ARROW:
            if ( index % boardWidth < boardWidth-1 ) {
                if ( position[index+1] == 0 ) {
                    position[index+1] = position[index];
                    position[index] = 0;
                    index = index+1
                    localchanges++;
                } else if ( position[index+1] == position[index]  ) {
                    position[index+1] = position[index] + position[index+1]
                    position[index] = 0;
                    index = index+1
                    localchanges++;
                    merged = true
                    score += position[index]
                    if ( allowFlashes ) {
                        board.flash(position, index )
                    }
                }
            }
            break;
        }
        if ( localchanges ) {
            changes += localchanges;
        }
        if ( merged ) { // only 1 merge per turn
            break
        }
    }
    return { "position": position, "changes":changes, "score":score };
}

function doTurn( position, move, allowFlashes=false ) {
    let result = {'changes' : 0, "score":0};
    let step;
    let endIndex;
    let startIndex;
    switch ( move ) {
        case DOWN_ARROW:
        case RIGHT_ARROW:
            startIndex = position.length-1
            endIndex = -1
            step = -1
            break;
        case LEFT_ARROW:
        case UP_ARROW:
            startIndex=0;
            endIndex = position.length
            step = 1
            break;
        default:
            throw "bad move "+move
    }
    for( let ii=startIndex; ii != endIndex; ii += step ) {
        let tmp = doSingleMove( position, ii, move, allowFlashes );
        result['position'] = tmp['position']
        result['changes'] += tmp['changes']
        result['score'] += tmp['score']
    }
    return result;
}

function generateRandomRun(position, movesLeft=-1, firstMove=UP_ARROW) {
	// from the position given we randomly
	// move a square up, down, left, right until
	// no more moves or our move counter is done
    let moves = [UP_ARROW,DOWN_ARROW,LEFT_ARROW,RIGHT_ARROW]
    let score = 0;
    let iterations =0;
    let changes = 0;
    
    // do first move which has been determined by caller
    let thisMove = firstMove
    let result = doTurn( position, thisMove, false );
    score += result['score'];
    if ( isGameOver( result['position'] ) ) {
        return { "changes":changes, "score":score, "keyCode":firstMove };
    }
    if ( movesLeft > 0 ) {
        movesLeft--;
    }
    
    // continue until all moves used up
	while( movesLeft < 0 || movesLeft > 0 ) {
        if ( iterations > 100 ) { // here to stop inf loops
            break;
        }
        iterations++;
        
        let allowedMoves = moves.splice(); //.filter( x => x > 0 );
        if ( allowedMoves.length == 0 ) {
            break;
        }
        // generate a random move
        let move = generateMove(allowedMoves.length);
        let thisMove = allowedMoves[move]
        let result = doTurn( position, thisMove, false );
        score += result['score'];
        if ( isGameOver( result['position'] ) ) {
            break
        }
        if ( movesLeft > 0 ) {
            movesLeft--;
        }
	}
	return { "changes":changes, "score":score, "keyCode":firstMove };
}

function updateData(chart, labels, data) {
    chart.data.datasets[0].data = data
    chart.update();
}



function monteCarloSearch( layout ) {
    let result = { "keyCode": LEFT_ARROW, "position":layout, "changes": 0 }
    let runs = []
    let scoresByMove = { "up":[], "down":[], "left":[], "right":[] }
    let moves = [UP_ARROW,DOWN_ARROW,LEFT_ARROW,RIGHT_ARROW]
    moves.map( function(firstmove) {
        for( let ii=0; ii < RUNS; ii++ ) {
            let run = generateRandomRun( layout.slice(), searchDepth, firstmove  )
            runs.push( run )
            switch( firstmove ) {
                case UP_ARROW:
                    scoresByMove["up"].push( run["score" ])
                    break
                case DOWN_ARROW:
                    scoresByMove["down"].push( run["score" ])
                    break
                case LEFT_ARROW:
                    scoresByMove["left"].push( run["score" ])
                    break
                case RIGHT_ARROW:
                    scoresByMove["right"].push( run["score" ])
                    break
            }
        }
    });
    let values = [];
    Object.keys(scoresByMove).map( function(k) {
        let sum = scoresByMove[k].reduce( (a,b) => a+b, 0)
        values.push(sum / RUNS);
    });
    updateData( myBarChart, Object.keys(scoresByMove), values );
    
    // find maximimum run
    let maxScore = 0
    let whichMax = []
    for( let ii=0; ii < values.length; ii++ ) {
        if ( values[ii] > maxScore ) {
            whichMax = [ ii ]
            maxScore = values[ii]
        } else if ( values[ii] == maxScore ) {
            whichMax.push( ii )
        }
    }
    let choice = floor( random( 0, whichMax.length ) )
    result["keyCode" ] = moves[ whichMax[ choice ] ]
    return result
}



class Board {    
    
	constructor() {
        this.flashing = false
        this.flashCounter = 0;
        this.flashIndex = [];    // always 1 + the index
        this.keyCode =0
        this.score = 0
        this.gameover = false
        this.numberOfMoves = 0
        this.topvalue = 0
        this.numbers = []
        this.movesTaken = []
        document.all['score'].innerHTML = this.score;
	}

	setKeyPressed(keyCode) {
        this.keyCode = keyCode
    }

    incrementNumberOfMoves() {
        this.numberOfMoves++
        document.getElementById("numberOfMoves").innerHTML = this.numberOfMoves
    }
    
    incrementScore(value) {
        this.score += value
        document.getElementById("score").innerHTML = this.score
    }

    updateSuggestion(suggestion) {
        document.getElementById("suggestion").innerHTML = keyToString( suggestion )
    }
    
    updateDirection(direction) {
        this.movesTaken.push( direction )
        document.getElementById("direction").innerHTML = keyToString( this.keyCode )
    }
    
    updateTopValue(value) {
        this.topvalue = value
        document.getElementById("topvalue").innerHTML = value
    }
    
    onGameOver() {
        document.getElementById("direction").innerHTML = "GAME OVER"
        this.gameover = true
        stop()
    }

    addNewTilesToBoard(layout, newTileCount) {
        let freePos = [];
        for( let ii =0; ii < layout.length; ii++ ) {
            if ( layout[ii] == 0 ) {
                freePos.push(ii)
            }
        }
        for( let ii=0; ii < newTileCount; ii++ ) {
            //let val = floor(pow( 2, floor(random(1,5)) ));
            let val = 2;
            let p = floor( random( 0, freePos.length ) )
            layout[ freePos[p] ] = val;
            freePos = freePos.slice(p, 1)
            if ( freePos.length == 0 ) {
                break
            }
        }
        return layout;
    }   
    
	update() {
        let result;
        
        if ( this.gameover ) { 
            return
        }
		if ( this.flashing == false ) {
            if ( mode == MONTECARLOSEARCH ) {
                // running automatically generate new move
                result = monteCarloSearch( this.numbers.slice() )
                this.updateSuggestion( result['keyCode'] )
                this.keyCode = result['keyCode'] 
            } else if ( mode == RANDOMWALK ) {
                let moves = [UP_ARROW,DOWN_ARROW,LEFT_ARROW,RIGHT_ARROW]
                this.keyCode = moves[ floor( random(0,4) ) ]
                this.updateSuggestion( this.keyCode )
            }
            
            if ( this.keyCode > 0 ) {
                this.updateDirection( this.keyCode )
                result = doTurn(this.numbers, this.keyCode, true);
                this.incrementNumberOfMoves();
                if ( result !== undefined ) {
                    this.incrementScore( result['score'] )
                    this.updateTopValue( Math.max(...result['position']) )
                    this.numbers = result['position'];
                }
                if ( isGameOver(this.numbers) ) {
                    this.onGameOver()
                    return;
                }
                // add new tiles
                numbers = this.addNewTilesToBoard(this.numbers, newTilesPerMove);
                
                // if playing manually we generate the next move ready for user
                // to consider
                if ( mode == MANUAL ) {
                    result = monteCarloSearch( numbers.slice() )
                    this.updateSuggestion( result['keyCode'] )
                }
            }
            this.keyCode =0
        } else {
            this.flashCounter++
            if ( this.flashCounter == 20 ) {
                this.flashCounter = 0;
                this.flashing = false;
                this.flashIndex = []
            }
        }
    }

    flash(index) {
        this.flashing = true
        this.flashIndex.push( index + 1 )
        this.flashCounter = 0;
    }
    
	display() {
        if ( this.gameover ) { 
            return
        }
        let x = cardSpacer;
        let y = cardSpacer;
        for( let ii=0; ii < this.numbers.length; ii++ ) {
            stroke(0,0,0)
            let a = [255,255,255]
            if ( this.numbers[ii] > 0 ) {
                let b = Math.log2( this.numbers[ii] ) - 1
                a = colors[ b % colors.length ]
            }
            if ( this.flashing && this.flashIndex.indexOf(ii+1) > -1 ) {
                if ( this.flashCounter % 4 == 0 ) {
                    a = [255,255,255]
                }
            }
            fill(a[0],a[1],a[2])
            rect( x, y, cardWidth, cardHeight )
            
            if ( this.numbers[ii] > 0 ) {
                stroke(255,255,255)
                fill( 255, 255, 255, 255 );
                
                if ( this.numbers[ii] > 10000 ) {
                    textSize(12);
                } else if ( this.numbers[ii] > 1000 ) {
                    textSize( 16 );
                } else if ( this.numbers[ii] > 100 ) {
                    textSize(24);
                } else if ( this.numbers[ii] > 10 ) {
                    textSize(32);
                } else {
                    textSize(32);
                }
                let label = ''+this.numbers[ii]
                let w = textWidth(label);
                let h = textAscent();
                text( label, x + cardWidth / 2 - w / 2, y + cardHeight - ( cardHeight / 2 - h / 2 ) );
            }
            
            x += cardWidth + cardSpacer;
            if ( ii % boardWidth == boardWidth-1 && ii > 0 ) {
                y += cardHeight + cardSpacer;
                x = cardSpacer;
            }
        }
    }
}



function keyPressed() {
    board.setKeyPressed( keyCode )
}

function generateNewBoardSetup() {
    let numbers = new Array( boardWidth * boardHeight );
    for( let ii=0; ii < numbers.length; ii++ ) {
        numbers[ii] = 0
    }
    for( let ii =0; ii < cardsToStartWith; ii++ ) {
        let val = floor(pow( 2, floor(random(1,2)) ));
        let col = floor(random( 0, boardHeight ))
        let row = floor(random( 0, boardWidth ))
        numbers[ ( row * boardWidth ) + col ] = val;
    }
    return numbers
}

function newGame(boardLayout=0) {
    document.getElementById("topvalue").innerHTML = 2
    document.getElementById("direction").innerHTML = "NEW GAME"
    document.getElementById("numberOfMoves").innerHTML = 0
	board = new Board();
    if ( boardLayout === 0 ) {
        numbers = generateNewBoardSetup();
    } else {
        numbers = boardLayout
    }
    board.numbers = numbers
    board.display();
} 


function initChart() {
    let datasets = {
            labels: ["up", "down", "left", "right"],
            datasets: [{ label: "Score",
                        data: [100,200,50,75],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255,99,132,1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)'
                        ],
                        borderWidth: 1
            }]
        };
    let options = {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        };
    
    var ctx = document.getElementById("chart")
    myBarChart = new Chart( ctx, {
        type: 'bar',
        data: datasets,
        options: options
    } );
}




// start the automated player
function start() {
    is_running  = true;
    mode = MONTECARLOSEARCH
}

// Stop the automated playing of the game
function stop() {
    is_running = false;
    mode = MANUAL
}

// function to reset game
function reset() {
    is_running = false;
    mode=MANUAL
    newGame()
}

function kernelDensityEstimator(kernel, X) {
  return function(V) {
    return X.map(function(x) {
      return [x, d3.mean(V, function(v) { return kernel(x - v); })];
    });
  };
}

function kernelEpanechnikov(k) {
  return function(v) {
    return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
  };
}


// Function to run strategies over the same game many times
// to see if monte carlo search was any better the choosing the 
// next move randomly.
function multiRunOnSameBoard() {
    var boardLayout = generateNewBoardSetup()
    var statsA = []
    var statsB = []
    var N = 30
    for( var ii=0; ii < N; ii++ ) {
        mode = MONTECARLOSEARCH
        console.log("[MONTECARLO] Running game "+ii+" Board: "+boardLayout)
        newGame(boardLayout.slice())
        start()
        while( board.gameover === false && board.numberOfMoves < 1000 ) {
            board.update();
        }
        multiGameStatistics = { "boardlayout": board.numbers, "score": board.score, "topvalue": board.topvalue, "numberOfMoves": board.numberOfMoves, "movesTaken":board.movesTaken };
        statsA.push( multiGameStatistics )
        mode=MANUAL
    }    
    for( var ii=0; ii < N; ii++ ) {
        mode = RANDOMWALK
        console.log("[RANDOMWALK] Running game "+ii+" Board: "+boardLayout)
        newGame(boardLayout.slice())
        start()
        while( board.gameover === false && board.numberOfMoves < 1000 ) {
            board.update();
        }
        multiGameStatistics = { "boardlayout": board.numbers, "score": board.score, "topvalue": board.topvalue, "numberOfMoves": board.numberOfMoves, "movesTaken":board.movesTaken };
        statsB.push( multiGameStatistics )
        mode=MANUAL
    }
    console.log(statsA)
    console.log(statsB)
    
    scoresA = []
    scoresB = []
    statsA.map( (x) => scoresA.push(x.score) )
    statsB.map( (x) => scoresB.push(x.score) )
    console.log( tTestTwoSample( scoresA, scoresB, 0 ) )

    return boardLayout
}

// P5.js setup function
function setup() {
    let canvas = createCanvas( ( cardWidth + cardSpacer ) * boardWidth + cardSpacer, ( cardHeight + cardSpacer ) * boardHeight + cardSpacer );
    canvas.parent('canvas-holder');
    background(0);
    initChart()
    //var boardLayout= multiRunOnSameBoard()
    var boardLayout = generateNewBoardSetup()
    newGame(boardLayout);
}

// p5.js draw function
function draw() {
    if ( is_running || mode == MANUAL ) {
        board.update();
        board.display();
    }
} 
 
