#!/usr/bin/env python3
import argparse
import os
import shutil
import sys

import htmlmin
import lesscpy
from jsmin import jsmin


def get_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="App Builder",
    )
    parser.add_argument(
        "-n",
        "--name",
        default=os.path.basename(os.path.dirname(os.path.abspath(__file__))),
        help="App package's base name",
    )
    parser.add_argument(
        "-d",
        "--debug",
        action="store_true",
        help="Bundle webxdc package with debugging tools included",
    )

    return parser


def size_fmt(num: float) -> str:
    suffix = "B"
    for unit in ["", "Ki", "Mi", "Gi", "Ti", "Pi", "Ei", "Zi"]:
        if abs(num) < 1024.0:
            return "%3.1f%s%s" % (num, unit, suffix)  # noqa
        num /= 1024.0
    return "%.1f%s%s" % (num, "Yi", suffix)  # noqa


def minify_js() -> None:
    if os.path.exists("js"):
        os.makedirs("build/js")
        files.extend(
            [f"js/{name}" for name in os.listdir("js") if name.endswith(".min.js")]
        )
        for filename in os.listdir("js"):
            if not filename.endswith(".min.js"):
                with open(f"js/{filename}", encoding="utf-8") as src:
                    with open(f"build/js/{filename}", "w", encoding="utf-8") as dest:
                        dest.write(jsmin(src.read()))


def minify_css() -> None:
    if os.path.exists("css"):
        os.makedirs("build/css")
        files.extend(
            [f"css/{name}" for name in os.listdir("css") if name.endswith(".min.css")]
        )
        for filename in os.listdir("css"):
            if not filename.endswith(".min.css"):
                with open(f"css/{filename}", encoding="utf-8") as src:
                    with open(f"build/css/{filename}", "w", encoding="utf-8") as dest:
                        dest.write(lesscpy.compile(src, minify=True, xminify=True))


def minify_html() -> None:
    for filename in os.listdir():
        if filename.endswith(".html"):
            with open(filename, encoding="utf-8") as src:
                with open(f"build/{filename}", "w", encoding="utf-8") as dest:
                    dest.write(htmlmin.minify(src.read()))


if __name__ == "__main__":
    args = get_parser().parse_args()
    app_archive = args.name if args.name.endswith(".xdc") else f"{args.name}.xdc"
    files = []

    # CLEAN
    shutil.rmtree("build", ignore_errors=True)
    for name in os.listdir():
        if os.path.isfile(name) and name.endswith(".xdc"):
            os.remove(name)

    if args.debug:
        files.append("eruda.min.js")

    if os.path.exists("assets"):
        shutil.copytree("assets", "build/assets")

    # TRANSCRYPT
    if os.path.exists("app.py"):
        from transcrypt.__main__ import main as transcrypt
        sys.argv = ["transcrypt"]
        if args.debug:
            sys.argv.append("-n")
        sys.argv.append("app.py")
        transcrypt()
        shutil.copytree("__target__", "build/__target__")
        os.remove(f"build/__target__/app.project")

    minify_js()
    minify_css()
    minify_html()

    # ADD METADATA
    for name in ("manifest.toml", "icon.png", "icon.jpg"):
        if os.path.exists(name):
            files.append(name)

    for path in files:
        shutil.copyfile(f"{path}", f"build/{path}")
    project_root = os.path.abspath(".")
    os.chdir("build")
    shutil.make_archive(f"{project_root}/{app_archive}", "zip")
    os.chdir(project_root)
    os.rename(f"{app_archive}.zip", app_archive)
    if os.path.exists("webxdc.js"):
        shutil.copyfile("webxdc.js", "build/webxdc.js")  # for testing

    with open(app_archive, "rb") as file:
        size = len(file.read())
    print(f"App saved as: {app_archive} ({size_fmt(size)})")
