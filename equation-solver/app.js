let currentLeft = null;
let currentRight = null;
let stepCount = 0;

function startSolver() {
  const input = document.getElementById('initialEq').value;
  if (!input.includes('=')) return alert('Please enter a valid equation.');

  const [left, right] = input.split('=').map(e => e.trim());
  currentLeft = left;
  currentRight = right;

  const container = document.getElementById('app');
  container.innerHTML = '';

  addStep(container, currentLeft, currentRight);
}

function checkSolved(first,second) {
    var isSolved = false;
    if (first.match(/^x\s*=/) || first === 'x' || first === '(x)' || first === 'x()') {
	isSolved = second.match(/^\d+(\.\d+)?$/);
	if (isSolved) {
	    const msg = document.createElement('div');
	    msg.className = 'result';
	    msg.textContent = `🎉 Equation solved: ${first} = ${second}`;
	    stepDiv.appendChild(msg);
	    parent.appendChild(stepDiv);
	}
    }
    return isSolved;
}

function addStep(parent, left, right) {
  stepCount++;

  const stepDiv = document.createElement('div');
  stepDiv.className = 'step';

  const header = document.createElement('div');
  header.className = 'result';
  header.textContent = `Step ${stepCount}: ${left} = ${right}`;
  stepDiv.appendChild(header);

  if (checkSolved(left, right) || checkSolved(right,left)) {
     return;
  }

/*
  if (left.match(/^x\s*=/) || left === 'x' || left === '(x)' || left === 'x()') {
    const isSolved = right.match(/^\d+(\.\d+)?$/);
    if (isSolved) {
      const msg = document.createElement('div');
      msg.className = 'result';
      msg.textContent = `🎉 Equation solved: ${left} = ${right}`;
      stepDiv.appendChild(msg);
      parent.appendChild(stepDiv);
      return;
    }
  }
*/
      
  const label = document.createElement('label');
  label.textContent = 'Next Instruction:';
  stepDiv.appendChild(label);

  const input = document.createElement('input');
  input.placeholder = 'e.g., subtract 1, divide by 2';
  stepDiv.appendChild(input);

  const button = document.createElement('button');
  button.textContent = 'Apply Instruction';
  button.onclick = () => {
    const instr = input.value.trim();
    const transform = parseInstruction(instr);
    if (!transform) return alert('Unsupported instruction.');

    try {
      const newLeft = math.simplify(`(${left}) ${transform}`).toString();
      const newRight = math.simplify(`(${right}) ${transform}`).toString();
      currentLeft = newLeft;
      currentRight = newRight;
      addStep(parent, newLeft, newRight);
    } catch (err) {
      alert('Error applying instruction.');
    }
  };

  stepDiv.appendChild(button);
  parent.appendChild(stepDiv);
}

function parseInstruction(instr) {
  const lower = instr.toLowerCase();
  if (lower.startsWith('subtract')) {
    const val = lower.replace('subtract', '').trim();
    return `-(${val})`;
  }
  if (lower.startsWith('add')) {
    const val = lower.replace('add', '').trim();
    return `+(${val})`;
  }
  if (lower.startsWith('multiply by')) {
    const val = lower.replace('multiply by', '').trim();
    return `*(${val})`;
  }
  if (lower.startsWith('divide by')) {
    const val = lower.replace('divide by', '').trim();
    return `/(${val})`;
  }
  return null;
}
