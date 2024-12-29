const axios = require("axios");
const githubConfig = require("./githubConfig");

const { GITHUB_TOKEN, REPO_OWNER, REPO_NAME, BRANCH } = githubConfig;

// 设置超时时间
const axiosInstance = axios.create({
  timeout: 10000, // 10秒超时
});

const getDirectoryContents = async (path) => {
  try {
    const fullPath = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    console.log('getDirectoryContents的fullPath', fullPath)
    const response = await axiosInstance.get(fullPath, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
    });
    console.log('getDirectoryContents的response', response.data)
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

module.exports = {
  sendJsonResponse,
  getDirectoryContents,
};
