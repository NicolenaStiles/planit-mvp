"use client";

import { useState } from "react";
import { Button } from "@mui/material";
import {
  PersonAdd as FollowIcon,
  PersonRemove as UnfollowIcon,
} from "@mui/icons-material";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

interface FollowButtonProps {
  entityId: string;
  initialFollowing?: boolean;
}

export default function FollowButton({
  entityId,
  initialFollowing = false,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const { user } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setFollowing(!following);
    // TODO: Wire up to API in later milestone
    console.log(`Follow entity ${entityId}: ${!following}`);
  };

  return (
    <Button
      variant={following ? "outlined" : "contained"}
      startIcon={following ? <UnfollowIcon /> : <FollowIcon />}
      onClick={handleClick}
      color={following ? "inherit" : "primary"}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
