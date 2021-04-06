const $fileForm = document.getElementById("file-form"),
    $urlForm = document.getElementById("url-form"),
    $imagePreview = document.getElementById("image-preview"),
    $info = document.getElementById("info"),
    $fileInput = document.getElementById("file-input"),
    $urlInput = document.getElementById("url-input"),
    $submit = document.getElementById("submit");

if (!($fileForm instanceof HTMLFormElement)) throw new TypeError("$fileForm is not form");
if (!($urlForm instanceof HTMLFormElement)) throw new TypeError("$urlForm is not form");
if (!($imagePreview instanceof HTMLImageElement)) throw new TypeError("$imagePreview is not image");
if (!($info instanceof HTMLDivElement)) throw new TypeError("$info is not div");
if (!($fileInput instanceof HTMLInputElement)) throw new TypeError("$fileInput is not input");
if (!($urlInput instanceof HTMLInputElement)) throw new TypeError("$urlInput is not input");
if (!($submit instanceof HTMLButtonElement)) throw new TypeError("$submit is not button");

const FILE_TYPE_REGEX = /^image\/(jpeg|gif|png|bmp|tiff|webp)/,
    imageHelper = new Image(),
    urlInputHelper = document.createElement("input");

urlInputHelper.type = "url";

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
 * @param {File | string} value
 */
const setValue = (value) => {
    if (typeof value === "string") {
        $fileInput.value = "";
        $urlInput.value = value;
    } else {
        const dt = new DataTransfer();
        dt.items.add(value);

        $fileInput.files = dt.files;
        $urlInput.value = "";
    }
};

/**
 * @param {string} url
 */
const getUrl = (url) => {
    try {
        return new URL(url);
    } catch {
        return null;
    }
};

/**
 * @param {File | string} src
 */
const loadImage = (src) => {
    showInfo("Loading image preview ...");

    let url;

    if (typeof src === "string") {
        const urlParsed = getUrl(src);

        if (urlParsed === null) return showInfo("Invalid URL", true);
        if (urlParsed.protocol === "blob:") return showInfo("Blob URLs are not allowed", true);

        url = urlParsed.href;
    } else if (src instanceof File) {
        if (!FILE_TYPE_REGEX.test(src.type)) {
            showInfo("File must be either JPEG, GIF, PNG, BMP, TIF or WebP", true);

            return;
        }

        url = URL.createObjectURL(src);
    }

    if (url === undefined) return showInfo("Couldn't recognize resource type", true);

    setValue(src);
    imageHelper.src = url;
};

/**
 * @param {DataTransfer} dt
 */
const loadDataTransfer = (dt) => {
    const file = dt.files.item(0);

    if (file !== null) {
        loadImage(file);

        return;
    }

    let url, text;

    for (const item of Array.from(dt.items)) {
        if (item.kind === "string") {
            if (item.type === "text/uri-list") {
                url = item;

                break;
            }

            if (item.type === "text/plain") {
                if (text === undefined) text = item;
            }
        }
    }

    if (url === undefined) {
        if (text === undefined) return;

        url = text;
    }

    url.getAsString(loadImage);
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

    loadImage(file);
});

$urlInput.addEventListener("change", () => {
    if (!$urlInput.validity.valid) return;

    const value = $urlInput.value.trim();

    if ($urlInput.value === "") return;

    loadImage(value);
});

$urlInput.addEventListener("paste", (e) => {
    e.stopPropagation();
});

$submit.addEventListener("click", (e) => {
    e.preventDefault();

    if ($fileInput.files === null) throw new Error("Can't access files property");

    const isFileValid = $fileInput.files.item(0) !== null,
        isUrlValid = $urlInput.validity.valid && $urlInput.value.trim() !== "";

    if (isFileValid) return $fileForm.submit();
    if (isUrlValid) return $urlForm.submit();

    showInfo("No valid image provided", true);
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
