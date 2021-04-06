const $form = document.getElementById("google-search-form"),
    $formImage = document.getElementById("encoded-image");

const $info = document.getElementById("info"),
    $imagePreview = document.getElementById("image-preview"),
    $fileInput = document.getElementById("file-input"),
    $urlInput = document.getElementById("url-input");

if (!($form instanceof HTMLFormElement)) throw new TypeError("$form is not form");
if (!($formImage instanceof HTMLInputElement)) throw new TypeError("$formImage is not input");

if (!($info instanceof HTMLDivElement)) throw new TypeError("$info is not div");
if (!($imagePreview instanceof HTMLImageElement)) throw new TypeError("$imagePreview is not image");
if (!($fileInput instanceof HTMLInputElement)) throw new TypeError("$fileInput is not input");
if (!($urlInput instanceof HTMLInputElement)) throw new TypeError("$urlInput is not input");

const imageHelper = new Image();

/** @type {File | null} */
let imageFile = null;

/**
 * @param {string} msg
 * @param {boolean} error
 */
const showInfo = (msg, error = false) => {
    $info.innerText = msg;

    if (error) {
        $info.classList.add("error");
    } else {
        $info.classList.remove("error");
    }

    $info.removeAttribute("hidden");
};

const clearInfo = () => {
    $info.setAttribute("hidden", "hidden");
    $info.innerText = "";
};

/**
 * @param {HTMLInputElement} input
 * @param {File} file
 */
const setFileValue = (input, file) => {
    const dt = new DataTransfer();
    dt.items.add(file);

    input.files = dt.files;
};

/**
 * @param {File | string} value
 */
const setValue = (value) => {
    if (typeof value === "string") {
        $fileInput.value = "";
        $urlInput.value = value;
    } else {
        setFileValue($fileInput, value);
        $urlInput.value = "";
    }
};

/**
 * @param {string} url
 */
const fetchImage = async (url) => {
    const r = await fetch(url),
        blob = await r.blob();

    $fileInput.value = "";
    loadImage(new File([blob], "search-image"));
};

/**
 * @param {File} file
 */
const loadImage = (file) => {
    showInfo("Loading image preview ...");

    imageFile = file;
    imageHelper.src = URL.createObjectURL(file);
};

/**
 * @param {DataTransfer} dt
 */
const loadDataTransfer = (dt) => {
    const file = dt.files.item(0);

    if (file !== null) {
        setValue(file);
        loadImage(file);

        return;
    }

    for (const item of Array.from(dt.items)) {
        if (item.kind === "string" && item.type === "text/plain") {
            item.getAsString((string) => {
                setValue(string);
                fetchImage(string);
            });
        }
    }
};

imageHelper.addEventListener("load", () => {
    $imagePreview.src = imageHelper.src;
});

imageHelper.addEventListener("error", () => {
    showInfo("Couldn't load image preview", true);
    URL.revokeObjectURL(imageHelper.src);
});

$imagePreview.addEventListener("load", () => {
    clearInfo();
    URL.revokeObjectURL($imagePreview.src);
});

$fileInput.addEventListener("change", () => {
    if ($fileInput.files === null) throw new Error("Can't access files property");

    const file = $fileInput.files.item(0);

    if (file === null) return;

    $urlInput.value = "";
    loadImage(file);
});

$urlInput.addEventListener("change", () => {
    if (!$urlInput.validity.valid) return;

    const value = $urlInput.value.trim();

    if ($urlInput.value === "") return;

    fetchImage(value);
});

$urlInput.addEventListener("paste", (e) => {
    e.stopPropagation();
});

$form.addEventListener("submit", (e) => {
    if (imageFile === null) {
        e.preventDefault();
        showInfo("No valid image provided", true);

        return;
    }

    setFileValue($formImage, imageFile);
});

document.addEventListener("paste", (e) => {
    if (e.clipboardData === null) return;

    e.preventDefault();

    loadDataTransfer(e.clipboardData);
});

document.addEventListener("dragover", (e) => {
    e.preventDefault();
});

document.addEventListener("drop", (e) => {
    if (e.dataTransfer === null) return;

    e.preventDefault();

    loadDataTransfer(e.dataTransfer);
});
