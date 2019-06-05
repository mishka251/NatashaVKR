from django.conf.urls import url, include
from . import views

urlpatterns = [
    url('stats', views.stats),
    url('', views.info),
]
