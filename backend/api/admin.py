from django.contrib import admin

from .models import AtaItem, CheckIn, Customer, MaterialUsage, Project, ScopeItem

admin.site.register(Customer)
admin.site.register(Project)
admin.site.register(ScopeItem)
admin.site.register(CheckIn)
admin.site.register(MaterialUsage)
admin.site.register(AtaItem)
