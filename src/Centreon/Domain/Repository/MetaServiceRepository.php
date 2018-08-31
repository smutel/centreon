<?php
namespace Centreon\Domain\Repository;

use Centreon\Infrastructure\CentreonLegacyDB\ServiceEntityRepository;
use PDO;

class MetaServiceRepository extends ServiceEntityRepository
{

    /**
     * Export
     * 
     * @param int $pollerId
     * @param array $templateChainList
     * @return array
     */
    public function export(int $pollerId, array $templateChainList = null): array
    {
        $sql = <<<SQL
SELECT l.* FROM(
SELECT
    t.*
FROM meta_service AS t
INNER JOIN meta_service_relation AS msr ON msr.meta_id = t.meta_id
INNER JOIN ns_host_relation AS hr ON hr.host_host_id = msr.host_id
WHERE hr.nagios_server_id = :id
GROUP BY t.meta_id
SQL;

        if ($templateChainList) {
            $list = join(',', $templateChainList);
            $sql .= <<<SQL

UNION

SELECT
    tt.*

FROM meta_service AS tt
INNER JOIN meta_service_relation AS _msr ON _msr.meta_id = tt.meta_id
WHERE _msr.host_id IN ({$list})
GROUP BY tt.meta_id
SQL;
        }

        $sql .= <<<SQL
) AS l
GROUP BY l.meta_id
SQL;

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':id', $pollerId, PDO::PARAM_INT);
        $stmt->execute();

        $result = [];

        while ($row = $stmt->fetch()) {
            $result[] = $row;
        }

        return $result;
    }

    public function truncate()
    {
        $sql = <<<SQL
TRUNCATE TABLE `meta_service_relation`;
TRUNCATE TABLE `meta_service`;
SQL;
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
    }
}