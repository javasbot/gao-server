// post.js
const axios = require("axios");
const githubConfig = require("./githubConfig");

const { GITHUB_TOKEN, REPO_OWNER, REPO_NAME, BRANCH } = githubConfig;

const getDirectoryContents = async (path) => {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

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
        link: item.html_url,
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

function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

module.exports = handlePost;
