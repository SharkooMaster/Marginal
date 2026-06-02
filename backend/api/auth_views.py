from django.contrib.auth import authenticate, get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Company, DeviceToken, UserProfile

User = get_user_model()


def tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def get_profile(user):
    """Return the user's profile, creating a fallback company for legacy users."""
    profile = getattr(user, "profile", None)
    if profile is None:
        company = Company.objects.create(name=user.first_name or user.username or "Mitt företag")
        profile = UserProfile.objects.create(
            user=user, company=company, role=UserProfile.Role.MANAGER,
            full_name=user.first_name or "",
        )
    elif profile.company is None:
        profile.company = Company.objects.create(name=user.first_name or "Mitt företag")
        profile.save()
    return profile


def user_data(user):
    profile = get_profile(user)
    return {
        "id": user.id,
        "email": user.email or user.username,
        "full_name": profile.full_name,
        "role": profile.role,
        "company": profile.company.name if profile.company else "",
        "company_id": profile.company_id,
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        company_name = (request.data.get("company") or "").strip() or "Mitt företag"
        full_name = (request.data.get("full_name") or "").strip()
        if not email or not password:
            return Response({"detail": "E-post och lösenord krävs."}, status=400)
        if User.objects.filter(username=email).exists():
            return Response(
                {"detail": "Ett konto med den e-posten finns redan."}, status=400
            )
        user = User.objects.create_user(
            username=email, email=email, password=password, first_name=full_name
        )
        company = Company.objects.create(name=company_name)
        UserProfile.objects.create(
            user=user, company=company, role=UserProfile.Role.MANAGER, full_name=full_name
        )
        return Response({**tokens_for(user), "user": user_data(user)}, status=201)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        user = authenticate(username=email, password=password)
        if not user:
            return Response({"detail": "Fel e-post eller lösenord."}, status=401)
        return Response({**tokens_for(user), "user": user_data(user)})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(user_data(request.user))


class DeviceTokenView(APIView):
    """Register an Expo push token for the current user's device."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = (request.data.get("token") or "").strip()
        platform = (request.data.get("platform") or "").strip()[:20]
        if not token:
            return Response({"detail": "Token saknas."}, status=400)
        DeviceToken.objects.update_or_create(
            token=token, defaults={"user": request.user, "platform": platform}
        )
        return Response({"ok": True}, status=201)


class TeamView(APIView):
    """List company members; managers can add workers."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_profile(request.user)
        members = UserProfile.objects.filter(company=profile.company).select_related("user")
        return Response(
            [
                {
                    "id": m.user_id,
                    "email": m.user.email or m.user.username,
                    "full_name": m.full_name,
                    "role": m.role,
                }
                for m in members
            ]
        )

    def post(self, request):
        profile = get_profile(request.user)
        if profile.role != UserProfile.Role.MANAGER:
            return Response({"detail": "Endast chefer kan lägga till medlemmar."}, status=403)
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        full_name = (request.data.get("full_name") or "").strip()
        role = request.data.get("role") or UserProfile.Role.WORKER
        if role not in (UserProfile.Role.MANAGER, UserProfile.Role.WORKER):
            role = UserProfile.Role.WORKER
        if not email or not password:
            return Response({"detail": "E-post och lösenord krävs."}, status=400)
        if User.objects.filter(username=email).exists():
            return Response({"detail": "E-posten används redan."}, status=400)
        user = User.objects.create_user(
            username=email, email=email, password=password, first_name=full_name
        )
        UserProfile.objects.create(
            user=user, company=profile.company, role=role, full_name=full_name
        )
        return Response(
            {"id": user.id, "email": email, "full_name": full_name, "role": role},
            status=201,
        )
