/**
 * Middleware: Auth Guard
 * Memblokir akses ke route /admin/* jika belum login
 */
function authGuard(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/admin/login');
}

module.exports = authGuard;
