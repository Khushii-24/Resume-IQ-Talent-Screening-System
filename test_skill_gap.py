from skill_extractor import compute_skill_gap

resume = [
    "python",
    "react",
    "docker",
    "mysql",
    "git"
]

jd = [
    "python",
    "docker",
    "aws",
    "redis"
]

print(compute_skill_gap(resume, jd))