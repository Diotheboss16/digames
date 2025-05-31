let box = document.getElementById("box");
let position = 0;
let speed = 2;

function animate() {
    position += speed;
    box.style.transform = `translateX(${position}px)`;
    requestAnimationFrame(animate);
}

animate();
