const axios = require("axios");
const githubConfig = require("./githubConfig");
const { getDirectoryContents, sendJsonResponse } = require("./commonConfig");
const { GITHUB_TOKEN, REPO_OWNER, REPO_NAME } = githubConfig;

// 删除文章
async function deletePost(req, res, { url }) {
  try {
    // 获取文件的 SHA，用于删除文件
    const fileInfo = await getDirectoryContents(url);
    const fileSha = fileInfo.sha;

    // 调用 GitHub API 删除文件
    const response = await axios.delete(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${url}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
        data: {
          message: "delete a file", // `Delete post: ${postName}`,
          sha: fileSha,
        },
      }
    );

    // 返回成功响应
    return sendJsonResponse(res, 200, {
      message: `${url}删除成功`,
      success: true,
    });
  } catch (error) {
    console.error(error);
    // 返回错误响应
    sendJsonResponse(res, 500, {
      success: false,
      message: "Failed to fetch articles",
    });
  }
}

module.exports = deletePost;
