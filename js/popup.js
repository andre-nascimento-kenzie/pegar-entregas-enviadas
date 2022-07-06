const form = document.getElementById("form");
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const courseId = parseInt(e.target[0].value);
    const button = document.getElementById("button");

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.storage.sync.set({ courseId });
    chrome.storage.sync.set({ tabId: tab.id });
    button.setAttribute("disabled", true);
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: script,
    });
    button.setAttribute("disabled", false);
});
