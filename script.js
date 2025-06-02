let box = document.getElementById("box");
let position = 0;
let speed = 2; // Pixels per frame
let direction = 1; // 1 for moving right, -1 for moving left

function animate() {
    let boxWidth = box.offsetWidth;
    if (position >= window.innerWidth - boxWidth || position <= 0) {
        direction *= -1; // Reverse direction
    }
    position += speed * direction;
    box.style.transform = `translateX(${position}px)`;
    console.log("Been Here!");
    console.log("Pos: " + position);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
