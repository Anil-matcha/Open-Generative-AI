/** @type {import('next').NextConfig} */
// This file sets a custom webpack configuration to use your Next.js app
const withTM = require("next-transpile-modules")([]);

const withPlugins = require("next-compose-plugins");

module.exports = withTM(
    withPlugins(
        [],
        {
            images: {
                unoptimized: true,
            },
        },
        { silent: true },
        {
            resolve: {
                extensions: [".ts", ".js"],
            },
        },
        { hideSourcemaps: true },
        {
            rules: [
                {
                    test: /\.tsx?$\.svg$/,
                    use: ["@svgr/webpack", "ts-loader"],
                    exclude: /node_modules/,
                },
            ],
        },
    ),
);
