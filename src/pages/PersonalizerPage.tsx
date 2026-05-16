import PersonalizerDialog from '../components/personalizer/PersonalizerDialog';

export default function PersonalizerPage({ appId, mode, initialTarget, onClose }) {
  return (
    <PersonalizerDialog
      open={true}
      onClose={onClose || (() => window.history.back())}
      appId={appId}
      mode={mode}
      initialTarget={initialTarget}
    />
  );
}
