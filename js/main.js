$(document).ready(function() {
    turingView.init();
});

function TuringMachine() {
    this.startState = 'qs';
    this.acceptState = 'qa';
    this.definedStates = []; // Object(currentState,currentSymbol,newState,newSymbol,direction)
    this.defaultTape = "10001";

    var stepsDone = 0;
    var currentState = 'qs';
    var currentTapeIndex = 0;
    var currentTape = "10001";
    var currentStatus = 0;

    //Public methods

    this.next = function() {
        if(currentStatus === 0) {

            var useableState = null;
            stepsDone++;
            var currentTapeSymbol = currentTape[currentTapeIndex];
            if(typeof currentTapeSymbol == "undefined" || currentTapeSymbol == " ") {
                currentTapeSymbol = "_";
            }

            for(var i = 0; i < this.definedStates.length; ++i) {
                if(this.definedStates[i].currentState === currentState && this.definedStates[i].currentSymbol == currentTapeSymbol) {
                    useableState = this.definedStates[i];
                    break;
                }

            }

            if(useableState === null) {
                currentStatus = -1;
                return currentStatus;
            }

            if(useableState.newSymbol == "_") {
                useableState.newSymbol = " ";
            }

            currentTape = currentTape.substr(0, currentTapeIndex) + useableState.newSymbol + currentTape.substr(currentTapeIndex + 1);

            currentState = useableState.newState;
            if(useableState.direction === '<') {
                currentTapeIndex--;
            } else if(useableState.direction === '>') {
                currentTapeIndex++;
            }

            if(currentState == this.acceptState) {
                currentStatus = 1;
                return currentStatus;
            }

            return useableState;

        }

        return currentStatus;
    }

    this.reset = function() {
        currentStatus = 0;
        stepsDone = 0;
        currentState = this.startState;
        currentTapeIndex = 0;
        currentTape = this.defaultTape;
    }

    this.loadCompilerData = function(dataArray) {
        if(typeof dataArray.settings.start !== "undefined" && dataArray.settings.start.length >= 1) {
            this.startState = dataArray.settings.start;
        } else {
            this.startState = 'qs';
        }

        if(typeof dataArray.settings.accept !== "undefined" && dataArray.settings.accept.length >= 1) {
            this.acceptState = dataArray.settings.accept;
        } else {
            this.acceptState = 'qa';
        }

        if(typeof dataArray.settings.tape !== "undefined" && dataArray.settings.tape.length >= 1) {
            this.defaultTape = dataArray.settings.tape.replace("_", " ");
        } else {
            this.defaultTape = "10001";
        }

        this.definedStates = dataArray.states;
        this.reset();
    }

    this.loadInput = function(data) {
        this.defaultTape = data;
        this.reset();
    }

    this.getData = function() {
        return {
            steps: stepsDone,
            state: currentState,
            status: currentStatus,
            tapeIndex: currentTapeIndex,
            tape: currentTape
        }
    }
}

function CompilerTuringFile() {
    this.compile = function(data) {
        var dataArray = {
            states: [],
            settings: {}
        };

        var settingMatches = matchAllRegex(/^\s*([a-zA-Z0-9]+)=([a-zA-Z0-9\+\-\*\=]+)\s*$/m, data);
        for(var i = 0; i < settingMatches.length; ++i) {
            dataArray.settings[settingMatches[i][1]] = settingMatches[i][2];
        }

        var statesMatches = matchAllRegex(/^\s*([a-zA-Z0-9]+),([a-zA-Z0-9_\+\-\*\=])\s*([a-zA-Z0-9]+),([a-zA-Z0-9_\+\-\*\=]),([\<\>\-])\s*$/m, data);
        for(var i = 0; i < statesMatches.length; ++i) {
            var state = statesMatches[i];

            dataArray.states.push({
                currentState: state[1],
                currentSymbol: state[2],
                newState: state[3],
                newSymbol: state[4],
                direction: state[5]
            });
        }

        return dataArray;
    }

    var matchAllRegex = function(regex, string) {
        var matches = [];
        var match = null;
        while((match = string.match(regex)) !== null) {
            match = match.splice(0, match.length);
            var startString = string.search(regex) + match[0].length;
            string = string.substr(startString);
            matches.push(match);
        }

        return matches;
    }
}

var turingView = {
    stepsDiv:   $('.turing_steps span'),
    stateDiv:   $('.turing_state span'),
    messageDiv: $('.turing_message'),
    tapeDiv:    $('.turing_tape pre'),

    inputField: $('input[name="turing_input"]'),
    scriptField: $('textarea[name="turing_script"]'),

    compiler: new CompilerTuringFile(),
    machine: new TuringMachine(),

    playMachine: false,

    init: function() {
        $('button[name="turing_submit_script"]').click(turingView.turingScriptLoad);
        $('button[name="turing_submit_input"]').click(turingView.turingInputLoad);
        $('button[name="turing_control_next"]').click(turingView.turingNext);
        $('button[name="turing_control_reset"]').click(turingView.turingReset);
        $('button[name="turing_control_play"]').click(turingView.turingPlay);
        $('button[name="turing_control_pause"]').click(turingView.turingPause);

        $('button[name="turing_control_fast"]').click(turingView.turingPlayFast);

        turingView.turingInputLoad();
        turingView.turingScriptLoad();
    },

    changes: {
        highlightTapeSymbol: function(index) {
            var currentTape = turingView.tapeDiv.text();
            var currentSymbol = currentTape[index];
            var beforeTape = currentTape.substr(0, index);
            var afterTape = currentTape.substr(index + 1);

            if(typeof currentSymbol == "undefined") {
                currentSymbol = " ";
            }

            turingView.tapeDiv.html(beforeTape+'<span>'+currentSymbol+'</span>'+afterTape);
        }
    },

    turingNext: function() {
        var data = turingView.machine.next();
        turingView.updateView();
        return data;
    },

    turingPause: function() {
        turingView.playMachine = false;
    },

    turingPlay: function() {
        turingView.playMachine = true;
        turingView.turingPlayNext();
    },

    turingPlayNext: function() {
        if(turingView.playMachine == true) {
            turingView.turingNext();
            var data = turingView.machine.getData();
            if(data.status !== 0){
                turingView.playMachine = false;
                return;
            }

            setTimeout(turingView.turingPlayNext, 100);
        }
    },

    turingPlayFast: function() {
       turingView.turingNext();
       var data = turingView.machine.getData();
       if(data.status !== 0){
           return;
       }

       setTimeout(turingView.turingPlayFast, 0);
    },

    turingScriptLoad: function() {
        var script = turingView.scriptField.val();
        var compilerData = turingView.compiler.compile(script);
        turingView.machine.loadCompilerData(compilerData);
        turingView.updateView();
    },

    turingInputLoad: function() {
        var input = turingView.inputField.val();
        turingView.machine.loadInput(input);
        turingView.updateView();
    },

    turingReset: function() {
       turingView.machine.reset();
       turingView.updateView();
    },

    updateView: function() {
        var data = turingView.machine.getData();

        turingView.stepsDiv.html(data.steps);
        turingView.stateDiv.html(data.state);
        turingView.tapeDiv.html(data.tape);
        turingView.changes.highlightTapeSymbol(data.tapeIndex);

        if(data.status === 1) {
            turingView.messageDiv.html('Program passed! :)');
        } else if(data.status === -1) {
            turingView.messageDiv.html('Program failed :(');
        } else if(data.status === 0) {
            turingView.messageDiv.html('Processing...');
        }

    }




};

if (!String.prototype.trim) {
    String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};
}