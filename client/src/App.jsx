import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Menu from './pages/Menu.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Notifications from './pages/Notifications.jsx';
import Feedback from './pages/Feedback.jsx';
import Profile from './pages/Profile.jsx';
import Kitchen from './pages/Kitchen.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminMenu from './pages/admin/MenuManage.jsx';
import AdminOrders from './pages/admin/OrdersManage.jsx';
import AdminStock from './pages/admin/StockManage.jsx';
import AdminUsers from './pages/admin/UsersManage.jsx';
import AdminAttendance from './pages/admin/Attendance.jsx';
import AdminFeedback from './pages/admin/FeedbackView.jsx';

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}

function RequireAuth({ children, roles }) {
  const { user, booting } = useAuth();
  const location = useLocation();
  if (booting) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/menu" replace />;
  return children;
}

const shell = (el) => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-6">{el}</main>
    <Footer />
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={shell(<Landing />)} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/menu" element={shell(<Menu />)} />
      <Route
        path="/cart"
        element={shell(
          <RequireAuth>
            <Cart />
          </RequireAuth>
        )}
      />
      <Route
        path="/checkout"
        element={shell(
          <RequireAuth>
            <Checkout />
          </RequireAuth>
        )}
      />
      <Route
        path="/orders"
        element={shell(
          <RequireAuth>
            <Orders />
          </RequireAuth>
        )}
      />
      <Route
        path="/orders/:id"
        element={shell(
          <RequireAuth>
            <OrderDetail />
          </RequireAuth>
        )}
      />
      <Route
        path="/notifications"
        element={shell(
          <RequireAuth>
            <Notifications />
          </RequireAuth>
        )}
      />
      <Route
        path="/feedback"
        element={shell(
          <RequireAuth>
            <Feedback />
          </RequireAuth>
        )}
      />
      <Route
        path="/profile"
        element={shell(
          <RequireAuth>
            <Profile />
          </RequireAuth>
        )}
      />

      {/* Kitchen (chef/staff/admin) */}
      <Route
        path="/kitchen"
        element={shell(
          <RequireAuth roles={['chef', 'admin', 'staff']}>
            <Kitchen />
          </RequireAuth>
        )}
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={shell(
          <RequireAuth roles={['admin']}>
            <AdminDashboard />
          </RequireAuth>
        )}
      />
      <Route
        path="/admin/menu"
        element={shell(
          <RequireAuth roles={['admin']}>
            <AdminMenu />
          </RequireAuth>
        )}
      />
      <Route
        path="/admin/orders"
        element={shell(
          <RequireAuth roles={['admin']}>
            <AdminOrders />
          </RequireAuth>
        )}
      />
      <Route
        path="/admin/stock"
        element={shell(
          <RequireAuth roles={['admin']}>
            <AdminStock />
          </RequireAuth>
        )}
      />
      <Route
        path="/admin/users"
        element={shell(
          <RequireAuth roles={['admin']}>
            <AdminUsers />
          </RequireAuth>
        )}
      />
      <Route
        path="/admin/attendance"
        element={shell(
          <RequireAuth roles={['admin']}>
            <AdminAttendance />
          </RequireAuth>
        )}
      />
      <Route
        path="/admin/feedback"
        element={shell(
          <RequireAuth roles={['admin']}>
            <AdminFeedback />
          </RequireAuth>
        )}
      />

      <Route path="*" element={shell(<Navigate to="/" replace />)} />
    </Routes>
  );
}
