from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text

from config import Config

db = SQLAlchemy()
migrate = Migrate()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    from app.routes.patients import patients_bp
    app.register_blueprint(patients_bp, url_prefix="/api/patients")

    @app.get("/")
    def root():
        return jsonify({
            "success": True,
            "message": "DScribe Patient Admission API is running",
            "frontend": "http://127.0.0.1:5173/",
            "health": "/api/health",
            "patients": "/api/patients",
        })

    @app.get("/api/health")
    def health():
        try:
            db.session.execute(text("SELECT 1"))
            return jsonify({"success": True, "data": {"status": "ok"}})
        except Exception:
            app.logger.exception("Database health check failed")
            db.session.rollback()
            return jsonify({"success": False, "data": {"status": "degraded"}}), 503

    @app.get("/health")
    def health_alias():
        return health()

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"success": False, "error": "Resource not found"}), 404

    @app.errorhandler(500)
    def server_error(_error):
        db.session.rollback()
        return jsonify({"success": False, "error": "An unexpected server error occurred"}), 500

    return app

