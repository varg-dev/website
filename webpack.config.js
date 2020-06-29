'use strict';

const glob = require('glob');
const path = require('path');
const webpack = require('webpack');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// Create named entries for each example.
let media = {};
for (const entry of glob.sync('\./application/media/*.png')) {
    media[path.parse(entry).name] = entry.replace('./application/media/', '/media/');
}

module.exports = [

    /* library export configuration */
    {
        context: __dirname + '/source',
        cache: false,
        entry: {
            'js/renderlib.js': ['polyfill.ts', 'renderlib.ts'],
        },
        devtool: 'source-map',
        plugins: [
            new webpack.DefinePlugin({
                DISABLE_ASSERTIONS: JSON.stringify(false),
                LOG_VERBOSITY_THRESHOLD: JSON.stringify(2),
            })
        ],
        output: {
            path: __dirname + '/build',
            filename: '[name]',
            library: 'renderlib',
            libraryTarget: 'umd',
        },
        /* comment out in order include webgl-operate in renderlib // like static linking :P */
        externals: {
            'webgl-operate': 'gloperate'
        },
        devServer: {
            contentBase: path.resolve(__dirname, "./source"),
            watchContentBase: true,
        },
        resolve: {
            modules: [__dirname + '/node_modules', __dirname + '/source'],
            extensions: ['.ts', '.tsx', '.js']
        },
        watchOptions: {
            ignored: ['node_modules/**']
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    include: /source/,
                    exclude: /(application|node_modules)/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            allowTsInNodeModules: true,
                            compilerOptions: {
                                declaration: false,
                                noUnusedLocals: false,
                                removeComments: true
                            }
                        }
                    }
                },
                {
                    test: /\.(glsl|vert|frag)$/,
                    exclude: /(node_modules)/,
                    use: { loader: 'webpack-glsl-loader' },
                },
            ]
        },
    },

    /* application export configuration */

    {
        context: __dirname + '/application',
        cache: false,
        entry: {
            'js/application.js': ['application.ts'],
            'css/styles': ['scss/styles.scss'],
        },
        devtool: 'source-map',
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    { from: 'data', to: 'data', force: true },
                    { from: 'img', to: 'img', force: true },
                    { from: 'media', to: 'media', force: true },
                    { from: 'fonts', to: 'css/fonts', force: true },
                    { from: '../node_modules/webgl-operate/dist/*', to: 'js/[name].[ext]', globOptions: { ignore: ['*.slim.*'] } },
                    { from: '../node_modules/rxjs/bundles/*', to: 'js/[name].[ext]', globOptions: { ignore: ['*.umd.js*'] } },
                ]
            }),
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: 'index.pug',
            }),
            new MiniCssExtractPlugin({
                filename: "[name].css"
            }),
            new webpack.DefinePlugin({
                VISUALIZATIONS: JSON.stringify(require('./visualizations.json')),
                MEDIA: JSON.stringify(media),
            }),
        ],
        output: {
            path: __dirname + '/build',
            filename: '[name]',
            library: undefined,
            libraryTarget: 'umd',
        },
        externals: {
            renderlib: true,
        },
        devServer: {
            contentBase: path.resolve(__dirname, "./application"),
            watchContentBase: true,
        },
        resolve: {
            modules: [
                __dirname + '/node_modules',
                __dirname + '/source',
                __dirname + '/application'],
            extensions: ['.ts', '.tsx', '.js']
        },
        watchOptions: {
            ignored: ['node_modules/**']
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    include: /application/,
                    exclude: /(source|node_modules)/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            compilerOptions: {
                                declaration: false,
                                noUnusedLocals: true,
                                removeComments: true
                            }
                        }
                    }
                },
                {
                    test: /\.pug$/,
                    exclude: /(node_modules)/,
                    use: [{
                        loader: 'pug-loader',
                    }],
                },
                {
                    test: /\.(woff2?|ttf|otf|eot|svg)$/,
                    exclude: /(node_modules)/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[path][name].[ext]',
                        },
                    }],
                },
                {
                    test: /\.(json)/,
                    exclude: /(node_modules)/,
                    loader: 'file-loader',
                    type: 'json',
                },
                {
                    test: /\.s[ac]ss$/,
                    use: [MiniCssExtractPlugin.loader, 'css-loader', 'resolve-url-loader', {
                        loader: 'sass-loader',
                        options: {
                            sassOptions: {
                                includePaths: ['node_modules/bootstrap/scss/'],
                            },
                        },
                    }],
                },
            ]
        },
    }

];
