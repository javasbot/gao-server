// post.js
const { getDirectoryContents, sendJsonResponse } = require("./commonConfig");

const handlePost = async (req, res, postData) => {
  const { articleType } = postData;

  try {
    const contents = await getDirectoryContents(articleType);
    if (!contents) {
      sendJsonResponse(res, 404, {
        success: false,
        message: "Directory not found",
      });
      return;
    }

    console.log('contents', contents)
    const articles = contents
      .filter((item) => item.type === "file")
      .map((item) => ({
        title: item.name.replace(".md", ""),
        link: item.html_url,
        download_url: item.download_url
      }));

    sendJsonResponse(res, 200, { success: true, articles });
  } catch (error) {
    console.error(error);
    sendJsonResponse(res, 500, {
      success: false,
      message: "Failed to fetch articles",
    });
  }
};

module.exports = handlePost;
