"use strict";

module.exports = ({ env }) => {
  console.log("AWS_BUCKET value:", env("AWS_BUCKET"));
  console.log("AWS_BUCKET type:", typeof env("AWS_BUCKET"));

  return {
    upload: {
      enabled: true,
      config: {
        provider: "aws-s3",
        providerOptions: {
          s3Options: {
            credentials: {
              accessKeyId: env("AWS_ACCESS_KEY_ID"),
              secretAccessKey: env("AWS_ACCESS_SECRET"),
            },
            endpoint: env("AWS_ENDPOINT"),
            region: env("AWS_REGION"),
            params: {
              Bucket: env("AWS_BUCKET"),
            },
            s3ForcePathStyle: true,
          },
          baseUrl: env("AWS_BASE_URL"),
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
        sizeLimit: 10 * 1024 * 1024,
      },
      security: {
        strictSsrfCheck: true,
      },
    },
    i18n: {
      enabled: true,
      config: {
        defaultLocale: "ar",
        locales: ["ar", "en", "ckb"],
      },
    },
  };
};
