let box = document.getElementById("box");
let position = 0;
let speed = 2; // Pixels per frame

function animate() {
    if (position < window.innerWidth - 50) {
        position += speed;
        box.style.transform = `translateX(${position}px)`;
        requestAnimationFrame(animate); // Call itself continuously
    } else {
        console.log("Animation stopped: Box reached the edge!");
    }
}

requestAnimationFrame(animate); // Starts the animation loop
