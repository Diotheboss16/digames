function applyInstruction() {
  const inputEq = document.getElementById('equation').value;
  const instruction = document.getElementById('instruction').value.trim();
  const output = document.getElementById('output');

  if (!inputEq.includes('=')) {
    output.textContent = 'Please enter a valid equation (e.g., 2x + 1 = 5)';
    return;
  }

  let [left, right] = inputEq.split('=').map(side => side.trim());

  try {
    let transform;
    if (instruction.startsWith('subtract')) {
      const val = instruction.replace('subtract', '').trim();
      transform = `-(${val})`;
    } else if (instruction.startsWith('add')) {
      const val = instruction.replace('add', '').trim();
      transform = `+(${val})`;
    } else if (instruction.startsWith('multiply by')) {
      const val = instruction.replace('multiply by', '').trim();
      transform = `*(${val})`;
    } else if (instruction.startsWith('divide by')) {
      const val = instruction.replace('divide by', '').trim();
      transform = `/(${val})`;
    } else {
      output.textContent = 'Unsupported instruction.';
      return;
    }

    const newLeft = math.simplify(`(${left}) ${transform}`).toString();
    const newRight = math.simplify(`(${right}) ${transform}`).toString();

    output.textContent = `${left} = ${right}\n↓\n${newLeft} = ${newRight}`;
  } catch (err) {
    output.textContent = 'Error applying instruction.';
  }
}
