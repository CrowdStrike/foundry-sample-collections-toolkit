import React, { useContext } from "react";
import { FalconApiContext} from "../contexts/falcon-api-context";
import { Link } from '../components/link';

function Home() {
  const { falcon } = useContext(FalconApiContext);

  return (
    <div className="mt-4 space-y-8">
       <p class="text-neutral"> 👋 Hi {falcon.data.user.username}</p>
       <Link useFalconNavigation={true} to="/crowdscore">Crowdscore</Link>
    </div>
  );
}

export { Home };