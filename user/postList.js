// 获取文章列表
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

    const articles = contents
      .filter((item) => item.type === "file")
      .map((item) => ({
        title: item.name.replace(".md", ""),
        path: item.path,
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
