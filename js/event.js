// header start

const el_app__button_mode = app.querySelector("#app__button-mode");
el_app__button_mode.onclick = () => settings.setStoreValue("theme.mode.dark", !store.value.theme.mode.dark);

const el_app__button_settings = app.querySelector("#app__button-settings");
el_app__button_settings.onclick = () => Bubble.toggle(el_app__button_settings.nextElementSibling);

const el_app__settings = app.querySelectorAll("#app__settings .bubble button");
el_app__settings.forEach(settings => {
    const dataset = settings.dataset.settings;

    settings.addEventListener("click", () => {
        Bubble.toggle(settings.parentElement.parentElement);
        masking.open(dataset);
    });
});

// header end

// masking start

const masking__close = app.querySelectorAll(".masking__close");
masking__close.forEach(close => {
    close.onclick = () => masking.close();
});

// masking end

// search start

const el_search = app.querySelector("#search");
el_search.onclick = () => search.historyOpen(el_search.nextElementSibling.nextElementSibling);
el_search.onkeydown = (event) => search.searchHandler(event, el_search.value);

const el_input__clear = app.querySelector("#search+.input__clear");
el_input__clear.onclick = () => Util.clearInput(el_input__clear);

const search__engine = app.querySelector("#search__engine");
search__engine.onclick = () => Bubble.toggle(search__engine.nextElementSibling);

const engine__selector__options = app.querySelectorAll("#engine__selector__options button.engine__selector__default");
engine__selector__options.forEach(option => {
    option.addEventListener("click", () => {
        Bubble.toggle(option.parentElement.parentElement);
        search.setWebsite(option);
    });
});

// search end

// routine start

const el_popup__routine_switch = app.querySelectorAll("#popup__routine input[type=checkbox]");
el_popup__routine_switch.forEach(elSwitch => {
    const dataset = elSwitch.parentElement.dataset.settings;

    elSwitch.addEventListener("change", () => settings.setStoreValue(dataset, elSwitch.checked));
});

const el_popup__routine_theme = app.querySelectorAll("#popup__routine #routine__theme input[type=radio]");
el_popup__routine_theme.forEach((elRadio, index) => {
    const dataset = elRadio.parentElement.dataset.settings;

    elRadio.addEventListener("change", () => settings.setStoreValue(dataset, index));
});

const el_search__history__clearAll = app.querySelector("#popup__routine #search__history__clearAll");
el_search__history__clearAll.onclick = () => search.historyClearAll();

const el_settings__routine__reset = app.querySelector("#settings__routine__reset");
el_settings__routine__reset.onclick = () => settings.resetRoutineSettings();

const el_localStore__clear = app.querySelector("#localStore__clear");
el_localStore__clear.onclick = () => store.removeAllLocalStorage();

// routine end

// engine start

const el_engine__add__button = app.querySelector("#engine__add__button");
el_engine__add__button.onclick = () => settings.addEngine();

// engine end

// wallpaper start

const el_popup__wallpaper_switch = app.querySelectorAll("#popup__wallpaper input[type=checkbox]");
el_popup__wallpaper_switch.forEach(elSwitch => {
    const dataset = elSwitch.parentElement.dataset.settings;

    elSwitch.addEventListener("change", () => settings.setStoreValue(dataset, elSwitch.checked));
});

// wallpaper end

// about start

const el_about__toGithub = app.querySelector("#popup__about #about__toGithub");
el_about__toGithub.onclick = () => window.location.replace("https://github.com/TwAzuremy/azure-page");

// about end

// other

const el_has__expand__item = app.querySelectorAll(".has-expand-item .setting__option__operation__container>button");
el_has__expand__item.forEach(has__expand__item => {
    has__expand__item.onclick = () => Settings.toggleExpandContainer(has__expand__item.parentElement.nextElementSibling);
});