"use client"
import { useUser } from "@clerk/nextjs"

const Dashboard = () => {

    const {user} = useUser();

    return (
        <div>
            <h1>Dashboard</h1>
            <p>{user?.emailAddresses[0]?.emailAddress}</p>
            <p>{user?.firstName}</p>
            <p>{user?.lastName}</p>
            <p>{user?.imageUrl}</p>
        </div>
    )
}

export default Dashboard