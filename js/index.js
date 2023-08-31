const app = document.getElementById("app");
const defaultLocalStorageValue = {
    search: {
        history: {
            toggle: true,
            list: [],
            length: 10
        },
        title: true
    },
    theme: {
        color: {
            primary: 0
        },
        mode: {
            system: false,
            dark: false
        }
    },
    performance: {
        blur: {
            search: true,
            expand: true
        }
    },
    vision: {
        clock: {
            display: true,
            second: false
        }
    },
    website: {
        default: 0,
        custom: {}
    },
    wallpaper: {
        toggle: false,
        index: 1,
        custom: {
            url: ""
        }
    }
};

class ObservableManager {
    constructor() {
        this.observedTargets = new Map();
    }

    createObservable(target, callback, path = "") {
        const proxy = this.createProxy(target, callback, path);
        this.observedTargets.set(proxy, callback);
        return proxy;
    }

    createProxy(target, callback, path = "") {
        if (typeof target !== "object" || target === null) {
            return target;
        }

        const self = this;
        let oldValue = target;

        return new Proxy(target, {
            get(obj, key) {
                const value = obj[key];
                const newPath = path ? `${path}.${key.toString()}` : key.toString();
                return self.createProxy(value, callback, newPath);
            },
            set(obj, key, value) {
                const newPath = path ? `${path}.${key}` : key.toString();
                if (obj[key] !== value) {
                    const newValue = value;
                    obj[key] = newValue;
                    callback(newPath, newValue);
                    oldValue = newValue;
                }
                return true;
            }
        });
    }

    removeObservable(observable) {
        if (this.observedTargets.has(observable)) {
            this.observedTargets.delete(observable);
            return true;
        }
        return false;
    }
}

const observable = new ObservableManager();

class Store {
    localStorageKey = "azure-home";

    constructor(func) {
        if (!localStorage.getItem(this.localStorageKey)) {
            localStorage.setItem(this.localStorageKey, JSON.stringify(defaultLocalStorageValue));
        }

        this.func = func;
        this.value = observable.createObservable(this.getLocalStorage(this.localStorageKey), this.func);
    }

    getLocalStorage(localStorageKey) {
        return JSON.parse(localStorage.getItem(localStorageKey));
    }

    save() {
        localStorage.setItem(this.localStorageKey, JSON.stringify(this.value));
    }

    getFunction() {
        return this.func;
    }

    removeAllLocalStorage() {
        localStorage.clear();
        toast.createToast(null, "success", "<h3>已清除</h3> 所有存储数据. <h3>3</h3> 秒后自动关闭页面.");

        setTimeout(() => {
            window.parent.close();
        }, 3000);
    }
}

class Toast {
    #container = app.querySelector("#toast__container");
    #svg = {
        success: `
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="ionicon" viewBox="0 0 512 512">
            <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z"/>
        </svg>
        `,
        error: `
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="ionicon" viewBox="0 0 512 512">
            <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm75.31 260.69a16 16 0 11-22.62 22.62L256 278.63l-52.69 52.68a16 16 0 01-22.62-22.62L233.37 256l-52.68-52.69a16 16 0 0122.62-22.62L256 233.37l52.69-52.68a16 16 0 0122.62 22.62L278.63 256z"/>
        </svg>
        `,
        warn: `
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="ionicon" viewBox="0 0 512 512">
            <path d="M449.07 399.08L278.64 82.58c-12.08-22.44-44.26-22.44-56.35 0L51.87 399.08A32 32 0 0080 446.25h340.89a32 32 0 0028.18-47.17zm-198.6-1.83a20 20 0 1120-20 20 20 0 01-20 20zm21.72-201.15l-5.74 122a16 16 0 01-32 0l-5.74-121.95a21.73 21.73 0 0121.5-22.69h.21a21.74 21.74 0 0121.73 22.7z"/>
        </svg>
        `,
        info: `
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="ionicon" viewBox="0 0 512 512">
            <path d="M256 56C145.72 56 56 145.72 56 256s89.72 200 200 200 200-89.72 200-200S366.28 56 256 56zm0 82a26 26 0 11-26 26 26 26 0 0126-26zm48 226h-88a16 16 0 010-32h28v-88h-16a16 16 0 010-32h32a16 16 0 0116 16v104h28a16 16 0 010 32z"/>
        </svg>
        `
    };
    #colors = {
        success: `var(--theme-ui-colors-green)`,
        error: `var(--theme-ui-colors-red)`,
        warn: `var(--theme-ui-colors-yellow)`,
        info: `var(--theme-ui-colors-blue)`
    };

    constructor() {
    }

    createToast(id = Date.now().toString(), type = "info", text, time = 3000) {
        if (!id) {
            id = Date.now().toString();
        }

        const toast = Template.toast(id, this.#colors[type], this.#svg[type], text, time);
        toast.querySelector("button").onclick = () => this.removeToast(toast);
        this.#container.appendChild(toast);
        toast.timeoutId = setTimeout(() => this.removeToast(toast), time);
    }

    removeToast(elToast) {
        elToast.classList.add("toast__status-hide");
        if (elToast.timeoutId) clearTimeout(elToast.timeoutId);

        setTimeout(() => elToast.remove(), parseFloat(Util.getCSSVariable(null, "--animation-duration-slow")) * 1000);
    }
}

const toast = new Toast();
const store = new Store(function (key, value, save = true) {
    // console.log(`${key} 值修改为`, value)

    const map = {
        "search.history.list": () => search.reloadHistory(),
        "search.history.toggle": () => {
            if (!value && save) {
                search.historyClearAll();
            }
        },
        "theme.color.primary": () => {
            const el = settings.getRoutineEl().themeColorPrimary[value];
            const hex = el.dataset.color;

            Util.setRootVariable("--theme-ui-colors-primary", hex);
        },
        "theme.mode.system": () => {
            Util.darkMode();

            if (save) {
                toast.createToast(null, "info", `<h3>深色模式:</h3> ${value ? "开" : "关"}`);
            }

            const themeModeDark = settings.getRoutineEl().themeModeDark;
            themeModeDark.querySelector("input[type=checkbox]").disabled = value;
        },
        "theme.mode.dark": () => {
            Util.darkMode();

            if (save) {
                toast.createToast(null, "info", `<h3>深色模式:</h3> ${value ? "开" : "关"}`);
            }

            const themeModeDark = settings.getRoutineEl().themeModeDark;
            themeModeDark.querySelector("input[type=checkbox]").checked = value;
        },
        "performance.blur.search": () => app.setAttribute("data-blurSearch", value.toString()),
        "performance.blur.expand": () => app.setAttribute("data-blurExpand", value.toString()),
        "search.title": () => {
            app.querySelector("#app__clock").classList.toggle("show", !value);
            app.querySelector("#header__clock").classList.toggle("show", value && store.value.vision.clock.display);

            app.querySelector("#app__title").classList.toggle("title__status-hide", !value);
        },
        "vision.clock.display": () => {
            app.querySelector("#app__clock").classList.toggle("show", value && !store.value.search.title);
            app.querySelector("#header__clock").classList.toggle("show", value && store.value.search.title);
        },
        "website.default": () => {
            const elWebsite = app.querySelectorAll("#engine__selector__options .engine__selector__option")[value];
            search.setWebsite(elWebsite);
        },
        "website.custom": () => {
            settings.reloadEngine();

            settings.getElements().input.engineName.value = "";
            settings.getElements().input.engineWebsite.value = "";
        },
        "wallpaper.index": () => {
            const wallpaper = settings.getWallpaperEl()[value];
            const wallpaperCustomUrl = settings.getElements().input.wallpaperUrl;

            if (store.value.wallpaper.toggle) {
                Util.setAppBackgroundImage(wallpaper.querySelector("img").src);

                if (!value && !wallpaperCustomUrl.value.trim()) {
                    toast.createToast(null, "warn", "请输入图片 / 壁纸链接 !");
                }
            }
        },
        "wallpaper.custom.url": () => {
            const customWallpaper = settings.getWallpaperEl()[0].querySelector("img");
            customWallpaper.src = value;
            customWallpaper.style.display = value ? "block" : "none";

            if (store.value.wallpaper.toggle && !store.value.wallpaper.index) {
                Util.setAppBackgroundImage(value);
            }
        },
        "wallpaper.toggle": () => {
            const wallpaper = settings.getWallpaperEl()[store.value.wallpaper.index];

            Util.setAppBackgroundImage(value ? wallpaper.querySelector("img").src : null);
        }
    };

    if (map[key]) {
        map[key]();
    }

    if (save) {
        store.save();
    }
});

window.addEventListener("error", (error) => {
    if (error.target?.alt === "wallpaper" &&
        store.value.wallpaper.toggle &&
        store.value.wallpaper.custom.url &&
        !store.value.wallpaper.index) {
        toast.createToast(null, "error", "图片 / 壁纸资源加载失败 !");
    }
}, true);

class Masking {
    #masking = app.querySelector("#masking");
    #popups = {};

    constructor(popups = []) {
        this.#masking.addEventListener("click", this.closeHandler.bind(this));
        popups.forEach(popup => this.#popups[popup] = this.#masking.querySelector(`#popup__${popup}`));
    }

    closeHandler(event) {
        if (event.currentTarget === event.target) {
            this.close();
        }
    }

    close() {
        this.#masking.classList.remove("status-open");
        this.#masking.querySelector(".popup.status-open").classList.remove("status-open");
    }

    open(elPopup) {
        this.#masking.classList.add("status-open");
        this.#masking.querySelector(`#popup__${elPopup}`).classList.add("status-open");
    }
}

const masking = new Masking(["routine", "engine", "wallpaper", "about"]);

class Template {
    static searchHistoryOnSearchBox(text) {
        return `<button class="button button__icon-text button__background-hover-normal search__history__option not-scale">
                    <svg width="24" height="24" viewBox="0 0 48 48" fill="none"
                         xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.81836 6.72729V14H13.0911" stroke="currentColor" stroke-width="4"
                              stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M4 24C4 35.0457 12.9543 44 24 44V44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C16.598 4 10.1351 8.02111 6.67677 13.9981"
                              stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M24.005 12L24.0038 24.0088L32.4832 32.4882" stroke="currentColor"
                              stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="button__text">${text}</span>
                    <span class="button button__only-icon button__color-hover-red not-scale search__history__delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                             class="feather feather-x">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </span>
                </button>`;
    }

    static searchHistoryOnRoutine(text) {
        return `<button class="button button__icon-text button__background-hover-normal search__history__option not-scale">
                    <span class="button__text">${text}</span>
                    <span class="button button__only-icon button__color-hover-red not-scale search__history__delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                             stroke-linecap="round" stroke-linejoin="round" class="feather feather-x">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </span>
                </button>`;
    }

    static engineOnSearchBox(name, website) {
        return `<button class="button button__icon-text button__background-hover-normal engine__selector__option engine__custom"
                        data-website="${website}" data-name="${name}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" class="feather feather-search">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <span class="button__text">${name}</span>
                </button>`;
    }

    static engineOnEngine(name, website) {
        return `<label class="setting__option only-operation radio__container style-engine engine__custom" data-name="${name}">
                    <input type="radio" name="engine-default">
                    <span class="radio__dot">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                             stroke-linejoin="round" class="feather feather-check">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </span>
                    <span class="engine__name">${name}</span>
                    <span class="engine__website">${website}</span>
                    <span class="button button__only-icon button__color-hover-red not-scale default__engine__delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                             stroke-linecap="round" stroke-linejoin="round" class="feather feather-x">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </span>
                </label>`;
    }

    static toast(id, color, svg, text, time) {
        const toast = document.createElement("li");
        toast.className = `toast toast__id-${id}`;
        toast.setAttribute("style", `--toast-ui-colors-progress: ${color}; --toast-time: ${time / 1000}s;`);
        toast.innerHTML = `<div class="toast__context">
                                ${svg}
                                <div class="toast__text">${text}</div>
                            </div>
                            <button class="button button__only-icon button__color-hover-red">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                     class="feather feather-x">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>`;

        return toast;
    }
}

class Settings {
    #routine = {};
    #engine = [];
    #wallpaper = [];
    #elements = {};

    constructor() {
        this.#elements = {
            input: {
                engineName: app.querySelector("#engine__custom__name"),
                engineWebsite: app.querySelector("#engine__custom__website"),
                wallpaperUrl: app.querySelector("#image__wallpaper")
            },
            container: {
                engineOnSearch: app.querySelector("#engine__selector__options .bubble__container"),
                engineOnEngine: app.querySelector("#popup__engine .engine__custom")
            }
        };

        this.#routine = {
            searchHistoryToggle: app.querySelector("[data-settings='search.history.toggle']"),
            themeColorPrimary: app.querySelectorAll("[data-settings='theme.color.primary']"),
            themeModeSystem: app.querySelector("[data-settings='theme.mode.system']"),
            themeModeDark: app.querySelector("[data-settings='theme.mode.dark']"),
            performanceBlurSearch: app.querySelector("[data-settings='performance.blur.search']"),
            performanceBlurExpand: app.querySelector("[data-settings='performance.blur.expand']"),
            searchTitle: app.querySelector("[data-settings='search.title']"),
            visionClockDisplay: app.querySelector("[data-settings='vision.clock.display']"),
            visionClockSecond: app.querySelector("[data-settings='vision.clock.second']"),
            // 混入一个 wallpaper 的设置
            wallpaperToggle: app.querySelector("[data-settings='wallpaper.toggle']")
        };
        this.#engine = app.querySelectorAll("input[type=radio][name='engine-default']");
        this.#wallpaper = app.querySelectorAll("[data-settings='wallpaper.index']");
    }

    initValue() {
        // init routine
        this.initRoutineSettings();

        // init engine
        this.reloadEngine();
        const engineDefaultAndCustom = app.querySelectorAll("input[type=radio][name='engine-default']");
        engineDefaultAndCustom[store.value.website.default].checked = true;

        // init wallpaper
        this.#wallpaper[store.value.wallpaper.index].querySelector("input[type=radio][name='wallpaper-images']").checked = true;
        this.#elements.input.wallpaperUrl.value = store.value.wallpaper.custom.url;
        this.#wallpaper[0].querySelector("img").src = this.#elements.input.wallpaperUrl.value;
        this.#wallpaper[0].querySelector("img").style.display = this.#elements.input.wallpaperUrl.value ? "block" : "none";
        if (store.value.wallpaper.toggle) {
            Util.setAppBackgroundImage(this.#wallpaper[store.value.wallpaper.index].querySelector("img").src);
        }
        this.initEventListener();
    }

    initRoutineSettings() {
        const storeFunc = store.getFunction();

        Object.keys(this.#routine).forEach(key => {
            const storeKey = Util.convertToCustomSeparator(key, ".");
            const value = Util.getStoreValue(store.value, storeKey);
            const el = this.#routine[key];

            if (el.constructor === NodeList) {
                el[value].querySelector("input[type=radio], input[type=checkbox]").checked = true;
            } else {
                el.querySelector("input[type=radio], input[type=checkbox]").checked = value;
            }

            storeFunc(storeKey, value, false);
        });
    }

    reloadEngine() {
        const websites = store.value.website.custom;
        const websitesKeyArray = Object.keys(websites);

        const website = websitesKeyArray[websitesKeyArray.length - 1];

        if (this.#elements.container.engineOnEngine.querySelector(`[data-name='${website}']`) ||
            this.#elements.container.engineOnSearch.querySelector(`[data-name='${website}']`)) {
            return;
        }

        if (!website) {
            return;
        }

        const engineOnSearchBox = Util.parseHTMLStringToElement(Template.engineOnSearchBox(website, websites[website]));
        const engineOnEngine = Util.parseHTMLStringToElement(Template.engineOnEngine(website, websites[website]));

        engineOnSearchBox.addEventListener("click", () => {
            Bubble.toggle(engineOnSearchBox.parentElement.parentElement);
            search.setWebsite(engineOnSearchBox);
        });

        engineOnEngine.querySelector("input[type=radio][name='engine-default']").onchange = () => settings.setEngineDefault(websitesKeyArray.length - 1 + this.#engine.length);
        engineOnEngine.querySelector("span.button").addEventListener("click", () => {
            settings.delEngine(website, websitesKeyArray.length - 1 + this.#engine.length);
            engineOnEngine.remove();
        });

        this.#elements.container.engineOnSearch.appendChild(engineOnSearchBox);
        this.#elements.container.engineOnEngine.appendChild(engineOnEngine);
    }

    initEventListener() {
        this.#engine.forEach((engine, index) => {
            engine.addEventListener("change", () => this.setEngineDefault(index));
        });

        this.#wallpaper.forEach((option, index) => {
            const radio = option.querySelector("input[type=radio][name='wallpaper-images']");
            radio.addEventListener("change", () => {
                this.setStoreValue("wallpaper.index", index);
            });
        });

        const wallpaperUrlInputHandler = Util.debounce(function () {
            this.setStoreValue("wallpaper.custom.url", this.#elements.input.wallpaperUrl.value);
        }, 500);

        this.#elements.input.wallpaperUrl.addEventListener("input", wallpaperUrlInputHandler.bind(this));
    }

    addEngine() {
        const name = this.#elements.input.engineName.value;
        const website = this.#elements.input.engineWebsite.value;

        if (!name.trim() || !website.trim()) {
            return;
        }

        // 这样才能触发 'website.custom' 的监听
        const newValue = store.value.website.custom;
        newValue[name] = website;
        store.value.website.custom = newValue;
    }

    delEngine(name, index) {
        if (index >= this.#engine.length) {
            this.setStoreValue("website.default", 0);
        }

        const {[name]: delKey, ...newObj} = store.value.website.custom;
        store.value.website.custom = newObj;
        toast.createToast(null, "success", `搜索引擎: ${name} <h3>已删除</h3>.`);
    }

    getElements() {
        return this.#elements;
    }

    getRoutineEl() {
        return this.#routine;
    }

    getWallpaperEl() {
        return this.#wallpaper;
    }

    resetRoutineSettings() {
        Object.keys(this.#routine).forEach(key => {
            if (key !== "wallpaperToggle") {
                const storeKey = Util.convertToCustomSeparator(key, ".");
                const value = Util.getStoreValue(defaultLocalStorageValue, storeKey);

                Util.setStoreValue(store.value, storeKey, value);
            }
        });

        this.initRoutineSettings();
        toast.createToast(null, "success", "<h3>已重置</h3> 所有常规选项");
    }

    setEngineDefault(index) {
        this.setStoreValue("website.default", index);
    }

    setStoreValue(key, value) {
        Util.setStoreValue(store.value, key, value);
    }

    static toggleExpandContainer(elExpand) {
        elExpand.classList.contains("status-open") ? this.shrinkExpandContainer(elExpand) : this.unfoldExpandContainer(elExpand);
    }

    static unfoldExpandContainer(elExpand) {
        const scrollHeight = elExpand.scrollHeight;

        elExpand.classList.add("status-open");
        elExpand.style.height = scrollHeight + "px";
    }

    static shrinkExpandContainer(elExpand) {
        elExpand.classList.remove("status-open");
        elExpand.removeAttribute("style");
    }
}

class Util {
    static getCSSVariable(element, variable) {
        if (!element) {
            element = document.documentElement; // 如果元素为null，则默认为:root元素
        }

        const styles = window.getComputedStyle(element);
        const variableValue = styles.getPropertyValue(variable);

        return variableValue.trim();
    }

    static formatTime(timestamp, showSeconds) {
        const date = new Date(timestamp);

        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");

        return `${hours}:${minutes}${showSeconds ? ":" + seconds : ""}`;
    }

    static clearInput(elClear) {
        elClear.previousElementSibling.value = "";
    }

    static convertToCustomSeparator(camelCase, separator) {
        return camelCase.replace(/([A-Z])/g, `${separator}$1`).toLowerCase();
    }

    static parseHTMLStringToElement(elementString) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = elementString;
        return tempDiv.firstElementChild;
    }

    static addElementToFirst(arr, element, maxLength) {
        // 如果数组中已经包含该元素
        if (arr.includes(element)) {
            // 先将该元素从数组中删除
            arr.splice(arr.indexOf(element), 1);
        }

        // 将元素添加到数组第一位
        arr.unshift(element);

        // 如果数组长度超过设定最大值
        if (arr.length > maxLength) {
            // 删除多余的元素
            arr.splice(maxLength);
        }

        return arr;
    }

    static setRootVariable(variableName, variableValue) {
        document.documentElement.style.setProperty(variableName, variableValue);
    }

    static darkMode() {
        const systemMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        const condition = systemMode && (store.value.theme.mode.system || store.value.theme.mode.dark);
        document.body.dataset.mode = condition ? "dark" : "light";
    }

    static setAppBackgroundImage(src = null) {
        if (src) {
            app.style.backgroundImage = `url('${src}')`;
        } else {
            app.removeAttribute("style");
        }
    }

    static debounce(func, delay = 200) {
        let timerId;

        return function (...args) {
            clearTimeout(timerId);
            timerId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    static copyToClipboard(text) {
        if ("clipboard" in navigator) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    // 复制成功
                })
                .catch(error => {
                    // 复制失败
                });
        }
    }

    static cutToClipboard(text, elInput) {
        if (!["text", "password", "number"].includes(elInput.type)) {
            return;
        }

        if ("clipboard" in navigator) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    // 复制成功
                    elInput.value = elInput.value.replace(text, "");
                })
                .catch(error => {
                    // 复制失败
                });
        }
    }

    static pasteFromClipboard(elInput) {
        if (!["text", "password", "number"].includes(elInput.type)) {
            return;
        }

        const startPos = elInput.selectionStart; // 获取当前光标位置

        if ("clipboard" in navigator) {
            navigator.clipboard.readText()
                .then(text => {
                    const value = elInput.value;

                    elInput.value = value.substring(0, startPos) + text + value.substring(elInput.selectionEnd);
                    elInput.setSelectionRange(startPos + text.length, startPos + text.length); // 设置新的光标位置
                })
                .catch(error => {
                    // 粘贴失败
                });
        }
    }

    static setStoreValue(proxy, location, value) {
        const locationArr = location.split(".");
        let currentObj = proxy;
        for (let i = 0; i < locationArr.length - 1; i++) {
            currentObj = currentObj[locationArr[i]];
        }
        const lastKey = locationArr[locationArr.length - 1];
        currentObj[lastKey] = value;
    }

    static getStoreValue(proxy, location) {
        const locationArr = location.split(".");
        let currentObj = proxy;
        for (let key of locationArr) {
            if (currentObj.hasOwnProperty(key)) {
                currentObj = currentObj[key];
            } else {
                return void 0;
            }
        }
        return currentObj;
    }
}

class Bubble {
    static classname = "bubble__status-open";

    static toggle(elButton) {
        elButton.parentElement.classList.contains(this.classname) ? this.close(elButton) : this.open(elButton);
    }

    static open(elBubble) {
        const parentElement = elBubble.parentElement;
        parentElement.classList.add(this.classname);

        const scrollHeight = elBubble.scrollHeight;
        const scrollWidth = elBubble.scrollWidth;
        elBubble.style.height = scrollHeight + parseInt(Util.getCSSVariable(elBubble, "--bubble-padding"), 10) + "px";
        elBubble.style.width = scrollWidth + "px";

        document.addEventListener("click", this.closeOnOutsideClick.bind(this, elBubble, parentElement));
    }

    static close(elBubble) {
        const parentElement = elBubble.parentElement;
        parentElement.classList.remove(this.classname);
        elBubble.removeAttribute("style");

        document.removeEventListener("click", this.closeOnOutsideClick.bind(this, elBubble, parentElement));
    }

    static closeOnOutsideClick(elBubble, parentElement, event) {
        const parentElementIdentifier = parentElement.dataset.identifier;

        if (parentElement.classList.contains("bubble__parentElement") && !event.target.closest(`.${this.classname}[data-identifier='${parentElementIdentifier}']`)) {
            this.close(elBubble);
        }
    }
}

class Search {
    #website = "https://www.bing.com/search?q=";
    #engineSelector = app.querySelector("#engine__selector");
    #historyOnSearchBox = app.querySelector("#search__history__options .bubble__container");
    #historyOnRoutine = app.querySelector("#popup__routine #search__history__show .setting__option__expand__container");

    constructor() {
        this.reloadHistory();

        const elWebsite = app.querySelectorAll("#engine__selector__options .engine__selector__option")[store.value.website.default];
        this.setWebsite(elWebsite);
    }

    reloadHistory() {
        this.#historyOnSearchBox.innerHTML = "";
        this.#historyOnRoutine.querySelectorAll("button").forEach(element => element.remove());

        const histories = store.value.search.history.list;

        histories.forEach(history => {
            const historyOnSearchBox = Util.parseHTMLStringToElement(Template.searchHistoryOnSearchBox(history));
            const historyOnRoutine = Util.parseHTMLStringToElement(Template.searchHistoryOnRoutine(history));

            historyOnSearchBox.addEventListener("click", () => search.skip(history));
            historyOnSearchBox.querySelector("span.button").addEventListener("click", (event) => search.historyClear(event, history));
            historyOnRoutine.querySelector("span.button").addEventListener("click", (event) => search.historyClear(event, history));

            this.#historyOnSearchBox.appendChild(historyOnSearchBox);
            this.#historyOnRoutine.appendChild(historyOnRoutine);
        });
    }

    historyClear(event, text) {
        event.stopPropagation();

        store.value.search.history.list = store.value.search.history.list.filter(item => item !== text);

        if (text.length >= 10) {
            text = text.slice(0, 10) + "...";
        }
        toast.createToast(null, "success", `搜索记录: ${text} <h3>已删除</h3>.`);
    }

    historyClearAll() {
        store.value.search.history.list = [];
        toast.createToast(null, "success", `<h3>已清空</h3> 搜索记录.`);
    }

    historyOpen(elBubble) {
        if (!store.value.search.history.list.length) {
            return;
        }

        Bubble.toggle(elBubble);
    }

    setWebsite(el) {
        const website = el.dataset.website;
        const icon = el.querySelector("svg").cloneNode(true);

        this.#website = website;
        this.#engineSelector.querySelector("#search__engine").innerHTML = new XMLSerializer().serializeToString(icon);
    }

    searchHandler(event, value) {
        if (event.keyCode === 13) {
            this.skip(value);
        }
    }

    skip(value) {
        let website = this.#website;
        website = website.includes("#") ? website.replace("#", value) : website + value;

        if (store.value.search.history.toggle) {
            // 避免获取 proxy 本身
            const history = [];
            for (const item of store.value.search.history.list) {
                history.push(item);
            }

            store.value.search.history.list = Util.addElementToFirst(history, value, store.value.search.history.length);
        }

        window.location.replace(website);
    }
}

class Contextmenu {
    #contextmenu = app.querySelector("#app__contextmenu");
    #options = {};
    #underlyingElement = null;

    constructor() {
        this.#options = {
            cut: this.#contextmenu.querySelector("[data-operation=cut]"),
            copy: this.#contextmenu.querySelector("[data-operation=copy]"),
            paste: this.#contextmenu.querySelector("[data-operation=paste]")
        };

        this.operator = {
            cut: () => Util.cutToClipboard(window.getSelection().toString(), this.#underlyingElement),
            copy: () => Util.copyToClipboard(window.getSelection().toString()),
            paste: () => Util.pasteFromClipboard(this.#underlyingElement)
        };

        this.initEventListener();
    }

    initEventListener() {
        document.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            this.shrink();

            this.#underlyingElement = event.target;
            const selectedText = window.getSelection().toString();
            this.disabledAllOperation();

            if (this.#underlyingElement.tagName === "INPUT" && selectedText && !this.#underlyingElement.hasAttribute("readonly")) {
                this.enableOperation(this.#options.cut);
            }
            if (selectedText) {
                this.enableOperation(this.#options.copy);
            }
            if (this.#underlyingElement.tagName === "INPUT" && !this.#underlyingElement.hasAttribute("readonly")) {
                this.enableOperation(this.#options.paste);
            }

            setTimeout(() => this.unfold(event), 100);
        });

        Object.keys(this.#options).forEach(option => {
            this.#options[option].onclick = this.operator[option];
        });

        this.#contextmenu.querySelector("[data-operation=refresh]").onclick = () => location.reload();
    }

    shrink() {
        this.#contextmenu.style.removeProperty("width");
        this.#contextmenu.style.removeProperty("height");
        document.removeEventListener("click", () => this.shrink());
    }

    unfold(event) {
        const position = this.getPosition(event);
        const windowSize = this.getWindowSize();
        let [menuLeft, menuTop] = position;

        const contextmenuSize = this.getContextmenuSize();
        if (position[0] + contextmenuSize[0] > windowSize[0]) {
            menuLeft = windowSize[0] - contextmenuSize[0];
        }

        if (position[1] + contextmenuSize[1] > windowSize[1]) {
            menuTop = windowSize[1] - contextmenuSize[1];
        }

        const style = {
            left: menuLeft + "px",
            top: menuTop + "px",
            width: contextmenuSize[0] + "px",
            height: contextmenuSize[1] + parseInt(Util.getCSSVariable(this.#contextmenu, "--contextmenu-padding"), 10) + "px"
        };

        Object.assign(this.#contextmenu.style, style);
        document.addEventListener("click", () => this.shrink());
    }

    getPosition(event) {
        return [event.clientX, event.clientY];
    }

    getWindowSize() {
        return [window.innerWidth, window.innerHeight];
    }

    getContextmenuSize() {
        return [this.#contextmenu.scrollWidth, this.#contextmenu.scrollHeight];
    }

    enableOperation(operation) {
        operation.disabled = false;
    }

    disabledAllOperation() {
        Object.values(this.#options).forEach(element => element.disabled = true);
    }
}

const settings = new Settings();
settings.initValue();
const search = new Search();
const contextmenu = new Contextmenu();

// 时钟
const mainClock = app.querySelector("#app__clock");
const headerClock = app.querySelector("#header__clock span");
let time = Util.formatTime(Date.now(), store.value.vision.clock.second);
mainClock.innerText = time;
headerClock.innerText = time;
setInterval(() => {
    time = Util.formatTime(Date.now(), store.value.vision.clock.second);

    mainClock.innerText = time;
    headerClock.innerText = time;
}, 1000);
