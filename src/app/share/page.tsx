import { ShareRedirect } from "@/components/ShareRedirect";

/** Target of "Share → KalkanCheck" (see manifest share_target). Forwards the shared link to the checker. */
export default function SharePage() {
  return <ShareRedirect />;
}
