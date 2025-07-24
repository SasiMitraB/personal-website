// Filename: .eleventy.js

module.exports = function(eleventyConfig) {
  // This is the magic line that copies our CSS file to the output.
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("apps");

  return {
    // When a passthrough file is modified, rebuild the site.
    passthroughFileCopy: true
  };
};