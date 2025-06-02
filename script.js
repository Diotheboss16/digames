window.onload = function() {
    let box = document.getElementById("box");
    localStorage.clear();
    box.style.transform = "translateX(0px)";
};

let box = document.getElementById("box");
let position = 0;
let speed = 2;
let direction = 1;

function animate() {
    let boxWidth = box.offsetWidth;
    let windowWidth = window.innerWidth;

    if (position + boxWidth >= windowWidth || position <= 0) {
        direction *= -1;
    }
    
    position += speed * direction;
    box.style.transform = `translateX(${position}px)`;

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
