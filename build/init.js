/**
* Small script for styling purposes, ran at the start of the application.
*/

const resWidth = window.screen.width * window.devicePixelRatio;
const newWidth = parseInt(0.40 * resWidth) + "px";
const containers = ['navbarContainer', 'widboxContainer', 'aboutboxContainer', 'termsboxContainer'];

(function() {

    // This block sets the given containers' widths upon fully loading; each
    // container width is meant to be proportional and constant to the initial
    // device width, but CSS cannot handle constants, thus we use:
    containers.forEach(function (container) {
        const config = { attributes: true, childList: true, subtree: true };
        const callback = function (mutations, observer) {
            let existingContainer = document.getElementById(container);
            if (existingContainer) {
                existingContainer.style.width = newWidth;
                observer.disconnect();
                return;
            }
        }
        let observer = new MutationObserver(callback).observe(document, config);
    });

}());

