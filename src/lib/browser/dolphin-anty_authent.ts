import Logger from "#utils/Logger";
import puppeteer from "puppeteer";

const axios = require("axios");

const API_TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZWFjYjhlODhhMTYwN2Q2NWNlZGY1NTg2ZjA3ODkzYmYxNjlmY2M1NGYzYzFmZmEzZGYzMmNhM2Q3ZmQwYmNmNGM1OGJlM2ExNGZlNDgzMzUiLCJpYXQiOjE3NDA2ODE2NTQuNTM1NTAzLCJuYmYiOjE3NDA2ODE2NTQuNTM1NTA1LCJleHAiOjE3NzIyMTc2NTQuNTI2MzE5LCJzdWIiOiI0MjA3NDIyIiwic2NvcGVzIjpbXX0.i8Ph0YhG0po_4nKRzFtSevmtLhFt8W38euyD8MaWY8lIsxHa0onOwAQ-fAhwi9wr-AKTQ23sHc5qa9d_kXKQTZj_B4t5_YPhSXA59jWGUEc25MWBoCOODcNCeph41UiToO4CPuvV9UMeCcdiDLO0RRKHUYrecpajLHYGQtc5tSMflX6iaVVX9ntqUGi9-1N4_VeEeTlZ9qcW_UzhbrH_5jG3ksl0a2hViah2WRvzuncCFPUcJsFz9rZ4lOl9OIG5N2ujajUcL0tG2Y9F489DHnKejwmPH8OB248d3scCoxuG0zpnAOgXephdvNuK-aePRNKpSR66QcuOfBWMqvYj7pAoNKQIUQkneg0MgTSlc0JdkWnhrhhwrPvgYs7EWRwmQCYwWJL-8R2Zb59-djkhIQjNVZ_Tjtfmspt26GwVE5X3EfCp5GURaJmSt8DrvuXnVsEIVgLWRAjSgQn8uFldDiv4_eiwRhqXalMCTWUuI9GT7Qz7c90dFa_oxYHjJWFeFX4OW_mLLupFZlkQLqB02kH7T343pZoO2lWiFYbf46K7_ZNY9Le0mP81lmasU5wh9j_85_GHFTqEtz-e-uRpSigHEuO-1MzOliIKeegiog5T5ejxJqYLqMUkhsp0tLcBnSS_OEBuAMnINQ8CJkllZZ1i0G-nM--WoFrZUKkfFOc"; // Remplace par ton token API
const API_URL = "http://localhost:3001/v1.0/auth/login-with-token";

export async function authenticateDolphinAnty() {
  try {
    const response = await axios.post(
      API_URL,
      { token: API_TOKEN },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    Logger.info("✅ Authentification success !");
    return response.data;
  } catch (error) {
    console.error(
      "❌ Erreur d'authentification :",
      error.response?.data || error
    );
  }
}

const PROFILE_ID = 578332125;

export async function startBrowserProfile() {
  const response = await axios.get(
    `http://localhost:3001/v1.0/browser_profiles/${PROFILE_ID}/start?automation=1`
  );
  if (!response.data || !response.data.automation.wsEndpoint) {
    throw new Error("Impossible de récupérer le wsEndpoint");
  }
  return response.data.automation;
}

export async function connectToBrowser() {
  try {
    await authenticateDolphinAnty();
    const wsEndpointData = await startBrowserProfile();
    const WS_ENDPOINT = ` ws://127.0.0.1:${wsEndpointData.port}${wsEndpointData.wsEndpoint}`; // Remplace par ton wsEndpoint
    const browser = await puppeteer.connect({
      browserWSEndpoint: WS_ENDPOINT,
      defaultViewport: null,
    });
    await browser;
    Logger.info("✅ Dolphin Anty connection is successful!");
    return browser;
  } catch (error) {
    console.error("❌ Error :", error);
    throw error;
  }
}
