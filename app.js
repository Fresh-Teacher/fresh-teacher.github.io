document.addEventListener("DOMContentLoaded", event => {
    document.querySelector("#btnLearn").addEventListener("click", event => {
        location.href = "https://www.freshteacher.software";
    });

    let bipEvent = null;
    window.addEventListener("beforeinstallprompt", event => {
        event.preventDefault();
        bipEvent = event;
    });

    document.querySelector("#btnInstall").addEventListener("click", event => {
        if (bipEvent) {
            bipEvent.prompt();
        } else {
            // incompatible browser, your PWA is not passing the criteria, the user has already installed the PWA
            //TODO: show the user information on how to install the app
            alert("To install the Fresh App, look for Add to Homescreen option in your Browser Menu");
        }
    });

    document.querySelector("#btnShare").addEventListener("click", event => {
        let notesString = "Hello, use the following link to install Fresh Teacher's App so that you can access free educational resources: https://freshteacher.software/Pdflip/index2.html";
        navigator.share({
            title: "Fresh Teacher's App",
            text: notesString
        }).catch(error => {
            console.error("Error sharing:", error);
        });
    });
});
