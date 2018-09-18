"""mySite URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from myApp.views import home, playground, assignment_1, assignment_2, assignment_3, shape_viewer

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home),
    path('Playground/', playground),
    path('shape_viewer/', shape_viewer),
    path('assignment_1/', assignment_1),
    path('assignment_2/', assignment_2),
    path('assignment_3/', assignment_3)
]
