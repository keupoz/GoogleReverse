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
 * @param {File} file
 */
const loadImage = (file) => {
    showInfo("Loading image preview ...");

    imageFile = file;
    imageHelper.src = URL.createObjectURL(file);
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

    fetch(value)
        .then((r) => r.blob())
        .then((blob) => {
            $fileInput.value = "";
            loadImage(new File([blob], "search-image"));
        });
});

$form.addEventListener("submit", (e) => {
    if (imageFile === null) {
        e.preventDefault();
        showInfo("No valid image provided", true);

        return;
    }

    const dt = new DataTransfer();
    dt.items.add(imageFile);
    $formImage.files = dt.files;
});
