const sections = document.querySelectorAll(".section");

const reveal = () => {
    const trigger = window.innerHeight * 0.85;

    sections.forEach(section => {
        const top = section.getBoundingClientRect().top;
        if (top < trigger) {
            section.classList.add("show");
        }
    });
};

window.addEventListener("scroll", reveal);
reveal();
