let persistentGroupColors = {};

function toggleAdvancedSettings() {
    const content = document.getElementById('advanced-settings-content');
    const toggle = document.getElementById('advanced-settings-toggle');
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        toggle.textContent = 'Advanced New Game Settings [Click to Close]';
    } else {
        content.style.display = 'none';
        toggle.textContent = 'Advanced New Game Settings [Click to Open]';
    }
}