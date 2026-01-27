import "./index.css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useNavigate } from "react-router";
import { Button } from "./components/ui/button";

export function AdminPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-row p-4 gap-4">
      <div className="flex flex-1 flex-col content-center justify-center justify-items-center items-center">
        <Button variant={"large"} onClick={() => navigate("/users")}>
          Manage Users
        </Button>
        <ReactQueryDevtools initialIsOpen={false} />
      </div>
      <div className="flex flex-1 flex-col justify-center items-center p-6">
        message board goes here
      </div>
    </div>
  );
}

export default AdminPage;
