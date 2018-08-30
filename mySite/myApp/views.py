from django.shortcuts import render
from django.http import HttpResponse


def home(request):
    return render(request, 'home.html')


def playground(request):
    return render(request, 'PixiJS_practice.html', {
        "title": "Playground",
        "JSsrc": "/static/playground.js",
    })


def shape_viewer(request):
    return render(request, 'shape_viewer.html', {
        "title": "shape_viewer"
    })


def assignment_1(request):
    return render(request, 'PixiJS_practice.html', {
        "title": "circle_and_square",
        "JSsrc": "/static/circle_and_square.js",
    })


def assignment_2(request):
    return render(request, 'PixiJS_practice.html', {
        "title": "zoom_in_and_zoom_out",
        "JSsrc": "/static/zoom_in_and_zoom_out.js",
    })


def assignment_3(request):
    return render(request, 'PixiJS_practice.html', {
        "title": "polygon",
        "JSsrc": "/static/polygon.js",
    })
