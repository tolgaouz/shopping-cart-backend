import nodeHTMLParser from "node-html-parser";
import { writeFileSync } from "fs";

const jeansUrl = "https://www.mavi.com/erkek/gomlek/c/2";

const getScraperApiUrl = (url: string) => {
  return `https://api.scraperapi.com/?api_key=490dbec8414e2f625945ad6ff1a49e87&url=${encodeURI(
    url
  )}`;
};

const getPageData = async (page = 1) => {
  const res = await fetch(getScraperApiUrl(`${jeansUrl}?page=${page}`));
  const html = await res.text();
  const doc = nodeHTMLParser.parse(html);
  const products = doc.querySelectorAll("button.js-action-add-favorite");
  return products
    .map((product) => {
      if (!product.hasAttribute("data-gtm-product")) {
        return null;
      }
      return JSON.parse(product.getAttribute("data-gtm-product")!);
    })
    .filter(Boolean);
};

const getAllProductsGTMData = async (page = 1) => {
  const pageData = await getPageData(page);
  if (pageData.length === 0) {
    return pageData;
  }
  return [...pageData, ...(await getAllProductsGTMData(page + 1))];
};

const getProductSpecificData = async (productLink) => {
  const res = await fetch(
    getScraperApiUrl("https://www.mavi.com" + productLink)
  );
  const html = await res.text();
  const doc = nodeHTMLParser.parse(html);
  const imagesContainer = doc.querySelector("#mainCarousel");
  const images = imagesContainer
    .querySelectorAll("img")
    .map((img) => img.getAttribute("src"));

  const color = doc
    .querySelector("div.product__color-name")
    .textContent.split(" - ")[1];
  return { images, color };
};

// Process data in batches of 10, waiting 10 seconds between each batch
const processInBatches = async (data, batchSize, delayTime) => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let productData = [];
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (product) => {
        const specificData = await getProductSpecificData(product.url);
        return { ...product, ...specificData };
      })
    );
    productData = [...productData, ...batchResults];
    if (i + batchSize < data.length) {
      // Only delay if there are more items to process
      console.log("current size:", productData.length);
      await delay(delayTime);
    }
  }
  return productData;
};

getAllProductsGTMData().then(async (data) => {
  console.log("retrieved data", data.length);
  const productData = await processInBatches(data, 5, 100); // 20 products per batch, 10 seconds delay
  console.log("finished getting products");
  // write to json
  writeFileSync("products.json", JSON.stringify(productData));
});
