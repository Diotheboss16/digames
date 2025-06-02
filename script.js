let box = document.getElementById("box");
let position = 0;
let speed = 2; // Pixels per frame
let direction = 1; // 1 for moving right, -1 for moving left

function animate() {
    let boxWidth = box.offsetWidth;
    if (position >= window.innerWidth - boxWidth) {
        position = window.innerWidth - boxWidth; // Ensure it doesn't go beyond the edge
        direction *= -1;
    }
    if (position <= 0) {
        position = 0; // Prevent negative position
        direction *= -1;
    }
    position += speed * direction;
    box.style.transform = `translateX(${position}px)`;
    console.log("Been Here!");
    console.log("Pos: " + position);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
