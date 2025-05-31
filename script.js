let box = document.getElementById("box");
let position = 0;
let speed = 2; // Pixels per frame

function animate() {
    if (position < window.innerWidth - 50) {
        position += speed;
        box.style.left = position + "px";
        requestAnimationFrame(animate); // Calls itself for smooth animation
    }
}

animate();
