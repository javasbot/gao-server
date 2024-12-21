// post.js
const { sendJsonResponse } = require("./commonConfig");
const axios = require("axios");

const handlePostDetail = async (req, res, postData) => {
  const { download_url } = postData;
  axios.get(download_url).then((result) => {
    // console.log(res.data);
    sendJsonResponse(res, 200, { success: true, content: result.data });
  });
};

module.exports = handlePostDetail;
