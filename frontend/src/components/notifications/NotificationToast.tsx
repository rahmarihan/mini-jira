'use client';

type NotificationToastProps = {
  message: string;
  visible: boolean;
};

export default function NotificationToast({
  message,
  visible,
}: NotificationToastProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-black px-4 py-3 text-white shadow-lg">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}