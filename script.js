let box = document.getElementById("box");
let position = 0;
let speed = 2; // Pixels per frame
let direction = 1; // 1 for moving right, -1 for moving left

function animate() {
    if (position >= window.innerWidth - 50 || position <= 0) {
        direction *= -1; // Reverse direction
    }
    position += speed * direction;
    box.style.transform = `translateX(${position}px)`;
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
